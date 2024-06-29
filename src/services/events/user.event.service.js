const { getIssue } = require('../issue.service');
const { addIssue } = require('../user.service');

async function handleIssueAssigned(context) {
  const { action, issue, assignee } = context.payload;

  const issueDB = await getIssue(issue.node_id);

  if (action === 'assigned' && issue.state === 'open') {
    await addIssue(assignee.login, issueDB, 'assigned');
  }
  if (action === 'unassigned' && issue.state === 'open') {
    await addIssue(assignee.login, issueDB, 'unassigned');
  }
}

async function handleIssueStateChange(context) {
  const { action, issue } = context.payload;

  const issueDB = await getIssue(issue.node_id);

  issue.assignees.forEach(async (assignee) => {
    if (action === 'closed') {
      await addIssue(assignee.login, issueDB, 'closed');
    }
    if (action === 'reopened') {
      await addIssue(assignee.login, issueDB, 'reopened');
    }
    if (action === 'opened') {
      await addIssue(assignee.login, issueDB, 'opened');
    }
  });
}

module.exports = {
  handleIssueAssigned,
  handleIssueStateChange,
};
