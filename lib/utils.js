const {GitHub} = require('@actions/github')
const {getInput} = require('@actions/core')

const {GITHUB_REPOSITORY, GITHUB_EVENT_NAME, GITHUB_HEAD_REF, GITHUB_REF} = process.env
const token = getInput('GITHUB_TOKEN', {required: true})
const octokit = new GitHub(token)

exports.extractRef = async () => {
  if (GITHUB_EVENT_NAME === 'pull_request_review') {
    const [owner, repo] = GITHUB_REPOSITORY.split('/')
    const [,, pull_number,] = GITHUB_REF.split('/')
    const {data: {head: {ref}}} = await octokit.pulls.get({owner, repo, pull_number})
    return ref
  } else if (GITHUB_HEAD_REF) {
    return GITHUB_HEAD_REF
  } else {
    const [,, ...branch] = GITHUB_REF.split('/')
    return branch.join('/')
  }
}
