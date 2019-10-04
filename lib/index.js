const {getInput, warning, setFailed} = require('@actions/core')
const {getProjectsAndBoards, getTaskDetails, moveTask} = require('./knz')
const {extractRef, checkApproved} = require('./utils')

const moveTo = getInput('MOVE_TO', {required: true})
const prefix = getInput('PREFIX')

const main = async () => {
  const branch = await extractRef()
  const [type, prefixedTask] = branch.split('/')
  if (!prefixedTask.startsWith(prefix)) {
    warning(`not kanbanize branch.(${branch}) ignore.`)
    return
  }

  const taskid = prefixedTask.replace(prefix, '')
  const {projects: [{id}]} = await getProjectsAndBoards()

  const task = await getTaskDetails(id, taskid)
  if (!task) {
    setFailed(`cannot find task (${taskid}) on kanbanize.`)
    return
  }

  const {boardid, columnname} = task
  if (moveTo === columnname) {
    warning(`task already on ${columnname}. ignore.`)
    return
  }

  if (moveTo === 'approved' && !checkApproved()) {
    warning('approve condition should be satisfied. ignore')
    return
  }

  await moveTask(boardid, taskid, moveTo)
}

main()
