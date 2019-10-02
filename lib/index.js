const {getInput} = require('@actions/core')
const {getProjectsAndBoards, getTaskDetails, moveTask} = require('./knz')
const branch = getInput('BRANCH', {required: true})
const moveTo = getInput('MOVE_TO', {required: true})

const ref = () => {
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF
  } else {
    const [,, ...branch] = process.env.GITHUB_REF.split('/')
    return branch.join('/')
  }
}

const checkApproved = () => {
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request_review') {
    return false
  }

  const path = process.env.GITHUB_EVENT_PATH
  const event = require(path)
  return event.review.state === 'APPROVED'
}

const main = async () => {
  const branch = ref()
  const [type, prefixedTask] = branch.split('/')
  if (!prefixedTask.startsWith('KB-')) {
    console.log('not kanbanize branch. ignore.')
    process.exit(0)
  }

  const taskid = prefixedTask.replace('KB-', '')
  const {projects: [{id}]} = await getProjectsAndBoards()

  const task = await getTaskDetails(id, taskid)
  if (!task) {
    console.error('cannot find task on kanbanize. error.')
    process.exit(1)
  }

  const {boardid, columnname} = task
  if (moveTo === columnname) {
    console.log(`task already on ${columnname}. ignore.`)
    process.exit(0)
  }

  if (moveTo === 'approved' && !checkApproved()) {
    console.log(`review type is not approved. ignore.`)
    process.exit(0)
  }

  await moveTask(boardid, taskid, moveTo)
  process.exit(0)
}

main()
