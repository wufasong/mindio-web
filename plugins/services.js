import ClipService from '~/services/clipService'
import LocalDocService from '~/services/localDocService'
import LocalMediaService from '~/services/localMediaService'
import ProjectService from '~/services/projectService'
import ServiceService from '~/services/serviceService'
import ResourceService from '~/services/resourceService'
import NoteService from '~/services/noteService'
import TagService from '~/services/tagService'
import UploadService from '~/services/uploadService'
import ProfileService from '~/services/profileService'
import FeishuService from '~/services/feishuService'
import ContactService from '~/services/contactService'
import WechatService from '~/services/wechatService'
import AiService from '~/services/aiService'
import RedditService from '~/services/redditService'
import NewsService from '~/services/newsService'

export default ({ $axios }, inject) => {
  inject('projectService', new ProjectService($axios))
  inject('serviceService', new ServiceService($axios))
  inject('resourceService', new ResourceService($axios))
  inject('noteService', new NoteService($axios))
  inject('tagService', new TagService($axios))
  inject('uploadService', new UploadService($axios))
  inject('profileService', new ProfileService($axios))
  inject('feishuService', new FeishuService($axios))
  inject('contactService', new ContactService($axios))
  inject('wechatService', new WechatService($axios))
  inject('aiService', new AiService($axios))
  inject('redditService', new RedditService($axios))
  inject('clipService', new ClipService($axios))
  inject('localDocService', new LocalDocService($axios))
  inject('localMediaService', new LocalMediaService($axios))
  inject('newsService', new NewsService($axios))
}
