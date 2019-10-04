const {GitHub} = require('@actions/github')
const {getInput, warning} = require('@actions/core')

const {GITHUB_REPOSITORY, GITHUB_EVENT_NAME, GITHUB_HEAD_REF, GITHUB_REF, GITHUB_EVENT_PATH} = process.env
const token = getInput('GITHUB_TOKEN', {required: true})
const octokit = new GitHub(token)

exports.getSlug = getSlug = () => {
  const [owner, repo] = GITHUB_REPOSITORY.split('/')
  return {owner, repo}
}

exports.extractRef = async () => {
  if (GITHUB_EVENT_NAME === 'pull_request_review') {
    const slug = getSlug()
    const [,, pull_number,] = GITHUB_REF.split('/')
    const {data: {head: {ref}}} = await octokit.pulls.get({...slug, pull_number})
    return ref
  } else if (GITHUB_HEAD_REF) {
    return GITHUB_HEAD_REF
  } else {
    const [,, ...branch] = GITHUB_REF.split('/')
    return branch.join('/')
  }
}

exports.checkApproved = async () => {
  if (GITHUB_EVENT_NAME !== 'pull_request_review') {
    warning(`[checkApproved] GITHUB_EVENT_NAME should be pull_request_review. (${GITHUB_EVENT_NAME})`)
    return false
  }

  const {review: {state}, pull_request: {number, base: {ref}}} = require(GITHUB_EVENT_PATH)
  const slug = getSlug()

  if (state === 'approved') {
    warning(`[checkApproved] pull_request_review.state should be approved. (${state})`)
    return false
  }

  const approvedCount = await octokit.pulls.listReviews({
    ...slug,
    pull_number: number
  })
  .then(({data}) => {
    const approvedUsers = data.filter(d => d.state === 'APPROVED').map(d => d.user.login)
    // uniq users
    return Array.from(new Set(approvedUsers)).length
  })

  const requiredApproveCount = await octokit.repos.getBranchProtection({
    ...slug,
    branch: ref,
    headers: {
      accept: 'application/vnd.github.luke-cage-preview+json'
    }
  })
  .then(({data}) => data.required_pull_request_reviews.required_approving_review_count)
  .catch(() => 1)

  if (approvedCount < requiredApproveCount) {
    warning(`[checkApproved] approvedCount should be greater or equal to requiredApproveCount. (approvedCount: ${approvedCount}, requiredApproveCount: ${requiredApproveCount})`)
    return false
  }

  return true
}
