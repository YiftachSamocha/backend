import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { getRandomInt, makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { execute } from '../../services/external.service.js'

const PAGE_SIZE = 3

export const taskService = {
	remove,
	query,
	getById,
	add,
	update,
	performTask
}

async function query(filterBy) {
	try {
		const collection = await dbService.getCollection('task')

		const isEmpty = await collection.countDocuments() === 0
		if (isEmpty) {
			const newTasks = createData()
			await collection.insertMany(newTasks)
			return newTasks
		}

		const criteria = _buildCriteria(filterBy)
		console.log(criteria)

		var taskCursor = await collection.find(criteria)
		const tasks = taskCursor.toArray()
		return tasks
	} catch (err) {
		logger.error('cannot find tasks', err)
		throw err
	}
}

async function getById(taskId) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(taskId) }

		const collection = await dbService.getCollection('task')
		const task = await collection.findOne(criteria)
		return task
	} catch (err) {
		logger.error(`while finding task ${taskId}`, err)
		throw err
	}
}

async function remove(taskId) {
	try {
		const criteria = {
			_id: ObjectId.createFromHexString(taskId),
		}

		const collection = await dbService.getCollection('task')
		const res = await collection.deleteOne(criteria)

		if (res.deletedCount === 0) throw ('Not your task')
		return taskId
	} catch (err) {
		logger.error(`cannot remove task ${taskId}`, err)
		throw err
	}
}

async function add(task) {
	try {
		const collection = await dbService.getCollection('task')
		await collection.insertOne(task)
		return task
	} catch (err) {
		logger.error('cannot insert task', err)
		throw err
	}
}

async function update(task) {
	const taskToSave = { ...task }
	try {
		const criteria = { _id: ObjectId.createFromHexString(task._id) }
		delete taskToSave._id
		const collection = await dbService.getCollection('task')
		await collection.updateOne(criteria, { $set: taskToSave })
		return task
	} catch (err) {
		logger.error(`cannot update task ${task._id}`, err)
		throw err
	}
}

async function performTask(task) {
	const taskToSave = { ...task }
	taskToSave.status = 'running'
	const criteria = { _id: ObjectId.createFromHexString(task._id) }
	delete taskToSave._id
	const collection = await dbService.getCollection('task')
	try {
		await execute(taskToSave)
		taskToSave.status = 'done'
		taskToSave.doneAt = new Date()
	} catch (error) {
		taskToSave.status = 'failed'
		taskToSave.errors.push(error)

	} finally {
		taskToSave.lastTriedAt = new Date()
		taskToSave.triesCount = taskToSave.triesCount + 1
		await collection.updateOne(criteria, { $set: taskToSave })
		return taskToSave

	}
}

function _buildCriteria(filterBy) {
	const criteria = {};

	// Text search on the 'title' field only
	if (filterBy.txt) {
		criteria.title = { $regex: filterBy.txt, $options: 'i' };
	}

	// Status filter
	const statusConditions = [];
	if (filterBy.status.new === true || filterBy.status.new === "true") statusConditions.push("new");
	if (filterBy.status.done === true || filterBy.status.done === "true") statusConditions.push("done");
	if (filterBy.status.fail === true || filterBy.status.fail === "true") statusConditions.push("failed");
	if (statusConditions.length) {
		criteria.status = { $in: statusConditions };
	}

	// Importance filter
	const importanceConditions = [];
	if (filterBy.importance.one === true || filterBy.importance.one === "true") importanceConditions.push(1);
	if (filterBy.importance.two === true || filterBy.importance.two === "true") importanceConditions.push(2);
	if (filterBy.importance.three === true || filterBy.importance.three === "true") importanceConditions.push(3);
	if (importanceConditions.length) {
		criteria.importance = { $in: importanceConditions };
	}

	return criteria;
}




function _buildSort(filterBy) {
	if (!filterBy.sortField) return {}
	return { [filterBy.sortField]: filterBy.sortDir }
}
function createData(length = 12) {
	const taskTitles = ['Delete old files', 'Update system drivers', 'Install security patch', 'Backup database', 'Optimize database performance', 'Clear cache', 'Archive completed projects', 'Generate monthly reports', 'Check system logs', 'Run antivirus scan', 'Restart server', 'Install software updates', 'Remove inactive users', 'Monitor network traffic', 'Clean temporary files']
	const statuses = ['new', 'failed'] //Done is not here because of the way the isDone is make
	const descriptions = ['Match files by size and name, remove duplicates', 'Optimize image assets', 'Implement JWT authentication', 'Create responsive design', 'Set up CI/CD pipeline', 'Integrate third-party API', 'Refactor legacy code', 'Design user-friendly dashboard', 'Implement data validation', 'Write unit tests']
	const randomDates1 = ['2023-01-15', '2023-05-22', '2022-07-10', '2022-10-18', '2023-09-05', '2022-04-30', '2023-03-12', '2023-07-28', '2022-11-11', '2023-08-01']
	const randomDates2 = ['2022-02-14', '2023-06-09', '2023-12-25', '2022-08-19', '2023-04-03', '2022-12-22', '2023-10-07', '2022-03-16', '2023-11-21', '2022-05-05']
	const errorMessages = ['Device is busy', 'Network timeout', 'File not found', 'Access denied', 'Disk space low', 'Invalid input format', 'Operation timed out', 'System error occurred', 'Permission denied', 'Unknown error', 'Resource unavailable', 'Connection refused', 'File read error', 'Out of memory', 'Service unavailable']
	var tasks = []
	for (var i = 0; i < length; i++) {
		const isDone = Math.random() < 0.3
		const task = {
			title: getRandomItems(taskTitles, 1),
			status: isDone ? 'done' : getRandomItems(statuses, 1),
			description: getRandomItems(descriptions, 1),
			importance: getRandomInt(1, 3),
			createdAt: new Date(getRandomItems(randomDates1, 1)),
			lastTriedAt: new Date(getRandomItems(randomDates2, 1)),
			triesCount: getRandomInt(0, 10),
			doneAt: isDone ? new Date(getRandomItems(randomDates1, 1)) : null,
			errors: getRandomItems(errorMessages, 3)
		}
		tasks.push(task)
	}
	return tasks
}

export function getRandomItems(arr, num) {
	const shuffled = arr.sort(() => 0.5 - Math.random())
	const result = shuffled.slice(0, num)
	return num === 1 ? result[0] : result
}
