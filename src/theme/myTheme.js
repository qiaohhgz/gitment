import { github as githubIcon, heart as heartIcon, spinner as spinnerIcon } from '../icons'
import { NOT_INITIALIZED_ERROR } from '../constants'

function renderHeader({ meta, user, reactions }, instance) {
  const container = document.createElement('div')
  container.lang = "zh-CN"
  container.className = 'gitment-container gitment-header-container'

  const likeButton = document.createElement('span')
  const likedReaction = reactions.find(reaction => (
    reaction.content === 'heart' && reaction.user.login === user.login
  ))
  likeButton.className = 'gitment-header-like-btn'
  likeButton.innerHTML = `
    ${heartIcon}
    ${ likedReaction
      ? '不喜欢'
      : '喜欢'
    }
    ${ meta.reactions && meta.reactions.heart
      ? ` • <strong>${meta.reactions.heart}</strong> 喜欢`
      : ''
    }
  `

  if (likedReaction) {
    likeButton.classList.add('liked')
    likeButton.onclick = () => instance.unlike()
  } else {
    likeButton.classList.remove('liked')
    likeButton.onclick = () => instance.like()
  }
  container.appendChild(likeButton)

  const commentsCount = document.createElement('span')
  commentsCount.innerHTML = `
    ${ meta.comments
    ? ` • <strong>${meta.comments}</strong> 评论`
    : ''
    }
  `
  container.appendChild(commentsCount)

  const issueLink = document.createElement('a')
  issueLink.className = 'gitment-header-issue-link'
  issueLink.href = meta.html_url
  issueLink.target = '_blank'
  issueLink.innerText = 'Issue Page'
  container.appendChild(issueLink)

  return container
}

function renderComments({ meta, comments, commentReactions, currentPage, user, error }, instance) {
  const container = document.createElement('div')
  container.lang = "zh-CN"
  container.className = 'gitment-container gitment-comments-container'

  if (error) {
    const errorBlock = document.createElement('div')
    errorBlock.className = 'gitment-comments-error'

    if (error === NOT_INITIALIZED_ERROR
      && user.login
      && user.login.toLowerCase() === instance.owner.toLowerCase()) {
      const initHint = document.createElement('div')
      const initButton = document.createElement('button')
      initButton.className = 'gitment-comments-init-btn'
      initButton.onclick = () => {
        initButton.setAttribute('disabled', true)
        instance.init()
          .catch(e => {
            initButton.removeAttribute('disabled')
            alert(e)
          })
      }
      initButton.innerText = '我要评论'
      initHint.appendChild(initButton)
      errorBlock.appendChild(initHint)
    } else {
      errorBlock.innerText = error
    }
    container.appendChild(errorBlock)
    return container
  } else if (comments === undefined) {
    const loading = document.createElement('div')
    loading.innerText = '加载中...'
    loading.className = 'gitment-comments-loading'
    container.appendChild(loading)
    return container
  } else if (!comments.length) {
    const emptyBlock = document.createElement('div')
    emptyBlock.className = 'gitment-comments-empty'
    emptyBlock.innerText = '什么都没有留下'
    container.appendChild(emptyBlock)
    return container
  }

  const commentsList = document.createElement('ul')
  commentsList.className = 'gitment-comments-list'

  comments.forEach(comment => {
    const createDate = new Date(comment.created_at)
    const updateDate = new Date(comment.updated_at)
    const commentItem = document.createElement('li')
    commentItem.className = 'gitment-comment'
    commentItem.innerHTML = `
      <a class="gitment-comment-avatar" href="${comment.user.html_url}" target="_blank">
        <img class="gitment-comment-avatar-img" src="${comment.user.avatar_url}"/>
      </a>
      <div class="gitment-comment-main">
        <div class="gitment-comment-header">
          <a class="gitment-comment-name" href="${comment.user.html_url}" target="_blank">
            ${comment.user.login}
          </a>
          commented on
          <span title="${createDate}">${createDate.toDateString()}</span>
          ${ createDate.toString() !== updateDate.toString()
            ? ` • <span title="comment was edited at ${updateDate}">edited</span>`
            : ''
          }
          <div class="gitment-comment-like-btn">${heartIcon} ${comment.reactions.heart || ''}</div>
        </div>
        <div class="gitment-comment-body gitment-markdown">${comment.body_html}</div>
      </div>
    `
    const likeButton = commentItem.querySelector('.gitment-comment-like-btn')
    const likedReaction = commentReactions[comment.id]
      && commentReactions[comment.id].find(reaction => (
        reaction.content === 'heart' && reaction.user.login === user.login
      ))
    if (likedReaction) {
      likeButton.classList.add('liked')
      likeButton.onclick = () => instance.unlikeAComment(comment.id)
    } else {
      likeButton.classList.remove('liked')
      likeButton.onclick = () => instance.likeAComment(comment.id)
    }

    // dirty
    // use a blank image to trigger height calculating when element rendered
    const imgTrigger = document.createElement('img')
    const markdownBody = commentItem.querySelector('.gitment-comment-body')
    imgTrigger.className = 'gitment-hidden'
    imgTrigger.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
    imgTrigger.onload = () => {
      if (markdownBody.clientHeight > instance.maxCommentHeight) {
        markdownBody.classList.add('gitment-comment-body-folded')
        markdownBody.style.maxHeight = instance.maxCommentHeight + 'px'
        markdownBody.title = 'Click to Expand'
        markdownBody.onclick = () => {
          markdownBody.classList.remove('gitment-comment-body-folded')
          markdownBody.style.maxHeight = ''
          markdownBody.title = ''
          markdownBody.onclick = null
        }
      }
    }
    commentItem.appendChild(imgTrigger)

    commentsList.appendChild(commentItem)
  })

  container.appendChild(commentsList)

  if (meta) {
    const pageCount = Math.ceil(meta.comments / instance.perPage)
    if (pageCount > 1) {
      const pagination = document.createElement('ul')
      pagination.className = 'gitment-comments-pagination'

      if (currentPage > 1) {
        const previousButton = document.createElement('li')
        previousButton.className = 'gitment-comments-page-item'
        previousButton.innerText = '上一页'
        previousButton.onclick = () => instance.goto(currentPage - 1)
        pagination.appendChild(previousButton)
      }

      for (let i = 1; i <= pageCount; i++) {
        const pageItem = document.createElement('li')
        pageItem.className = 'gitment-comments-page-item'
        pageItem.innerText = i
        pageItem.onclick = () => instance.goto(i)
        if (currentPage === i) pageItem.classList.add('gitment-selected')
        pagination.appendChild(pageItem)
      }

      if (currentPage < pageCount) {
        const nextButton = document.createElement('li')
        nextButton.className = 'gitment-comments-page-item'
        nextButton.innerText = '下一页'
        nextButton.onclick = () => instance.goto(currentPage + 1)
        pagination.appendChild(nextButton)
      }

      container.appendChild(pagination)
    }
  }

  return container
}

function renderEditor({ user, error }, instance) {
  const container = document.createElement('div')
  container.lang = "zh-CN"
  container.className = 'gitment-container gitment-editor-container'

  const shouldDisable = user.login && !error ? '' : 'disabled'
  const disabledTip = user.login ? '' : '请先登录'
  container.innerHTML = `
      ${ user.login
        ? `<a class="gitment-editor-avatar" href="${user.html_url}" target="_blank">
            <img class="gitment-editor-avatar-img" src="${user.avatar_url}"/>
          </a>`
        : user.isLoggingIn
          ? `<div class="gitment-editor-avatar">${spinnerIcon}</div>`
          : `<a class="gitment-editor-avatar" href="${instance.loginLink}" title="login with GitHub">
              ${githubIcon}
            </a>`
      }
    </a>
    <div class="gitment-editor-main">
      <div class="gitment-editor-header">
        <nav class="gitment-editor-tabs">
          <button class="gitment-editor-tab gitment-selected">编辑</button>
          <button class="gitment-editor-tab">预览</button>
        </nav>
        <div class="gitment-editor-login">
          ${ user.login
            ? '<a class="gitment-editor-logout-link">退出</a>'
            : user.isLoggingIn
              ? '登录中...'
              : `<a class="gitment-editor-login-link" href="${instance.loginLink}">使用GitHub登录</a>`
          }
        </div>
      </div>
      <div class="gitment-editor-body">
        <div class="gitment-editor-write-field">
          <textarea placeholder="Leave a comment" title="${disabledTip}" ${shouldDisable}></textarea>
        </div>
        <div class="gitment-editor-preview-field gitment-hidden">
          <div class="gitment-editor-preview gitment-markdown"></div>
        </div>
      </div>
    </div>
    <div class="gitment-editor-footer">
      <a class="gitment-editor-footer-tip" href="https://guides.github.com/features/mastering-markdown/" target="_blank">
        支持 Markdown 语法的呦 e.g # 这是一级标题 ## 这是二级标题
      </a>
      <button class="gitment-editor-submit" title="${disabledTip}" ${shouldDisable}>提交</button>
    </div>
  `
  if (user.login) {
    container.querySelector('.gitment-editor-logout-link').onclick = () => instance.logout()
  }

  const writeField = container.querySelector('.gitment-editor-write-field')
  const previewField = container.querySelector('.gitment-editor-preview-field')

  const textarea = writeField.querySelector('textarea')
  textarea.oninput = () => {
    textarea.style.height = 'auto'
    const style = window.getComputedStyle(textarea, null)
    const height = parseInt(style.height, 10)
    const clientHeight = textarea.clientHeight
    const scrollHeight = textarea.scrollHeight
    if (clientHeight < scrollHeight) {
      textarea.style.height = (height + scrollHeight - clientHeight) + 'px'
    }
  }

  const [writeTab, previewTab] = container.querySelectorAll('.gitment-editor-tab')
  writeTab.onclick = () => {
    writeTab.classList.add('gitment-selected')
    previewTab.classList.remove('gitment-selected')
    writeField.classList.remove('gitment-hidden')
    previewField.classList.add('gitment-hidden')

    textarea.focus()
  }
  previewTab.onclick = () => {
    previewTab.classList.add('gitment-selected')
    writeTab.classList.remove('gitment-selected')
    previewField.classList.remove('gitment-hidden')
    writeField.classList.add('gitment-hidden')

    const preview = previewField.querySelector('.gitment-editor-preview')
    const content = textarea.value.trim()
    if (!content) {
      preview.innerText = '什么都没有'
      return
    }

    preview.innerText = '正在渲染...'
    instance.markdown(content)
      .then(html => preview.innerHTML = html)
  }

  const submitButton = container.querySelector('.gitment-editor-submit')
  submitButton.onclick = () => {
    submitButton.innerText = '提交中...'
    submitButton.setAttribute('disabled', true)
    instance.post(textarea.value.trim())
      .then(data => {
        textarea.value = ''
        textarea.style.height = 'auto'
        submitButton.removeAttribute('disabled')
        submitButton.innerText = '提交'
      })
      .catch(e => {
        alert(e)
        submitButton.removeAttribute('disabled')
        submitButton.innerText = '提交'
      })
  }

  return container
}

function renderFooter() {
  const container = document.createElement('div')
  container.lang = "en-US"
  container.className = 'gitment-container gitment-footer-container'
  container.innerHTML = `
    技术支持
    <a class="gitment-footer-project-link" href="https://github.com/imsun/gitment" target="_blank">
      Gitment
    </a>
  `
  return container
}

function render(state, instance) {
  const container = document.createElement('div')
  container.lang = "zh-CN"
  container.className = 'gitment-container gitment-root-container'
  container.appendChild(instance.renderHeader(state, instance))
  container.appendChild(instance.renderComments(state, instance))
  container.appendChild(instance.renderEditor(state, instance))
  container.appendChild(instance.renderFooter(state, instance))
  return container
}

export default { render, renderHeader, renderComments, renderEditor, renderFooter }
