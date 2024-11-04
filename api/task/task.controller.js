import { logger } from '../../services/logger.service.js'
import { taskService } from './task.service.js'

export async function getTasks(req, res) {
	try {
		const filterBy = {
			txt: req.query.txt || '',
			importance: req.query.importance || { one: false, two: false, three: false },
			status: req.query.status || { new: false, done: false, fail: false }
		}
		const tasks = await taskService.query(filterBy)
		res.json(tasks)
	} catch (err) {
		logger.error('Failed to get tasks', err)
		res.status(400).send({ err: 'Failed to get tasks' })
	}
}

export async function getTaskById(req, res) {
	try {
		const taskId = req.params.id
		const task = await taskService.getById(taskId)
		res.json(task)
	} catch (err) {
		logger.error('Failed to get task', err)
		res.status(400).send({ err: 'Failed to get task' })
	}
}

export async function addTask(req, res) {
	const { body: task } = req

	try {
		const addedTask = await taskService.add(task)
		res.json(addedTask)
	} catch (err) {
		logger.error('Failed to add task', err)
		res.status(400).send({ err: 'Failed to add task' })
	}
}

export async function updateTask(req, res) {
	const { body: task } = req

	try {
		const updatedTask = await taskService.update(task)
		res.json(updatedTask)
	} catch (err) {
		logger.error('Failed to update task', err)
		res.status(400).send({ err: 'Failed to update task' })
	}
}

export async function removeTask(req, res) {
	try {
		const taskId = req.params.id
		const removedId = await taskService.remove(taskId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove task', err)
		res.status(400).send({ err: 'Failed to remove task' })
	}
}

export async function addTaskMsg(req, res) {
	const { loggedinUser } = req

	try {
		const taskId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await taskService.addTaskMsg(taskId, msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to update task', err)
		res.status(400).send({ err: 'Failed to update task' })
	}
}

export async function removeTaskMsg(req, res) {
	try {
		const taskId = req.params.id
		const { msgId } = req.params

		const removedId = await taskService.removeTaskMsg(taskId, msgId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove task msg', err)
		res.status(400).send({ err: 'Failed to remove task msg' })
	}
}


export async function onPerformTask(req, res) {
	const { body: task } = req

	try {
		const updatedTask = await taskService.performTask(task)
		res.json(updatedTask)
	} catch (err) {
		logger.error('Failed to update task', err)
		res.status(400).send({ err: 'Failed to update task' })
	}
}
