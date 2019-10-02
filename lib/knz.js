const {getInput} = require('@actions/core')
const axios = require('axios')
const apikey = getInput('API_KEY', {required: true})

const v1 = axios.create({
  baseURL: 'https://chainpartners.kanbanize.com/index.php/api/kanbanize',
  headers: {
    apikey,
    Accept: 'application/json'
  }
})

const v2 = axios.create({
  baseURL: 'https://chainpartners.kanbanize.com/api/v2',
  headers: {
    apikey,
    Accept: 'application/json'
  }
})

exports.getProjectsAndBoards = async () => {
  const {data} = await v1.post('get_projects_and_boards')
  return data
}

exports.getTaskDetails = async (boardid, taskid) => {
  try {
    const {data} = await v1.post('get_task_details', {boardid, taskid})
    return data
  } catch (e) {
    if (e.response.status === 400) {
      return false
    }
    throw e
  }
}

exports.moveTask = async (boardid, taskid, column) => {
  try {
  const {status, data} = await v1.post('move_task', {boardid, taskid, column})
  } catch (e) {
    throw new Error(`move_task failed - ${e.response.data}`)
  }
}
