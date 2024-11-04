import { getRandomItems } from "../api/task/task.service.js"
const errorMessages = ['Device is busy', 'Network timeout', 'File not found', 'Access denied', 'Disk space low', 'Invalid input format', 'Operation timed out', 'System error occurred', 'Permission denied', 'Unknown error', 'Resource unavailable', 'Connection refused', 'File read error', 'Out of memory', 'Service unavailable']
export function execute(task) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.5)
                resolve(parseInt(Math.random() * 100))
            else {
                const err = getRandomItems(errorMessages, 1)
                reject(err)
            }
        }, 5000)
    })
}


