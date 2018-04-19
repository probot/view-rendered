const path = require('path')

module.exports = (robot) => {
  robot.on('pull_request.opened', addRenderedLinks)

  async function addRenderedLinks (context) {
    const markdownFiles = await getMarkdownFiles(context)

    if (markdownFiles.length === 0) {
      return
    }

    robot.log.debug('pull_request.opened payload', context.payload)
    const pull = context.payload.pull_request
    const repo = context.payload.repository

    const rendered = `
<!-- Generated by View Rendered -->

### View Rendered

${markdownFiles.map(file => { return link(context.payload, file) }).join('\n')}

<!-- End View Rendered -->
`

    const body = pull.body + rendered
    const props = {
      owner: repo.owner.login,
      repo: repo.name,
      number: pull.number,
      body
    }

    robot.log.debug(props)
    context.github.pullRequests.update(props)
  }

  function link(payload, file) {
    return `* [${fileLabel(file)}](${fileLink(payload, file)})`
  }

  function fileLabel (file) {
    return file.filename
  }

  function fileLink ({repository, pull_request}, file) {
    return repository.html_url + path.join('/blob', pull_request.head.ref, file.filename)
  }

  async function getMarkdownFiles (context) {
    const files = await context.github.pullRequests.getFiles(context.issue())

    return files.data.filter(file => file.filename.match(/\.(md|markdown)$/))
  }
}
