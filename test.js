const {GeweBot} = require('./dist/index.js')



const bot = new GeweBot({
  debug: true, // 是否开启调试模式 默认false 开启调试将在控制台输出回调接口接收到的内容
  port: 3000, // 本地服务端口 默认3000
  proxy: process.env.WEGE_LOCAL_PROXY, // 本地代理地址，用于gewechat的docker在云时无法访问本地时使用 可为空 如果有则使用代理 否则使用本机ip地址例如 （http://proxy.domain.com:3000）注意需要跟上端口号
  static: "static", // 本机静态托管的目录 用于文件下载和上传 默认为static
  route: "/getWechatCallBack", // 本地回调接口route 默认为 `/getWechatCallBack` 最终地址为 `http://本机ip:port/getWechatCallBack`
  base_api: process.env.WEGE_BASE_API_URL, // 基础api地址base_api 默认为 `http://本机ip:2531/v2/api`
  file_api: process.env.WEGE_FILE_API_URL, // 文件api地址base_api 默认为 `http://本机ip:2532/download`,
});
// 如果docker 和GeweBot在同一台电脑上 可以直接使用 new GeweBot() 即可

// 监听消息事件
const onMessage = async (msg) => {
  // // 处理消息...
  // console.log(26,msg)
  // // 回复文本消息
  // if (msg.type() === bot.Message.Type.Text) { //类型详见 MessageType 表
  //   await msg.say("Hello, World!");
  // }
}

bot.on('all', msg => { // 如需额外的处理逻辑可以监听 all 事件 该事件将返回回调地址接收到的所有原始数据
  // console.log('received all event.',msg)
})

bot.on("message", (msg) => {
  // 此处放回的msg为Message类型 可以使用Message类的方法
  onMessage(msg);
});
bot.start().then(async ({app, router})=>{
  /**
   * 由于本地需要启动一个web服务， 此时返回的app为一个koa创建的服务实例，
   * router为koa-router实例，因此可以给其添加新的路由事件，一般用于第三方的webhook回调
   * 让微信机器人可以通过其他三方的http请求发送通知
   *  */

  // 添加一个路由用于接收其他三方的http请求
  // 如下代码可通过请求 http://localhost:3000/sendText?text=123 则会发送消息123 给test用户
  router.get('/sendText', async (ctx) => {
    const query = ctx.request.query; // 获取 GET 请求的 query 参数
    const text = query.text; // 获取 text 参数的值
    const contact = await bot.Contact.find({name: '1000488702'}) // 获取联系人
    contact.say(text)
    ctx.body = '发送成功'
  })

  router.get('/sendRoom', async (ctx) => {
    const query = ctx.request.query; // 获取 GET 请求的 query 参数
    const text = query.text; // 获取 text 参数的值
    // const contact = await bot.Contact.find({name: '1000488702'}) // 获取联系人
    const room = await bot.Room.find({topic:'测试群'})
    room && room.say(text)
    ctx.body = '发送成功'
  })

  router.post('/sendRoom', async (ctx) => {
      let json = JSON.parse(ctx.request.rawBody)
    let obj ={}
    if(json.type === 'ACK_SUCCESS'){
      obj= {
        '请求状态':'成功',
        "请求项目":json.name,
        '请求内容':json.data,
        '请求时间':json.time
      }
    }else if(json.type === 'ACK_FAIL'){
      obj= {
        '请求状态':'失败',
        "请求项目":json.name,
        '请求内容':json.data,
        '请求时间':json.time
      }
    }
    const room = await bot.Room.find({topic:'测试群'})
    let sayRes = await  room.say(JSON.stringify(obj))
    if(sayRes){
      ctx.body = '发送成功'
      ctx.status = 200
    }else{
      ctx.body = '发送失败'
      ctx.status = 400
    }
  })
  app.use(router.routes()).use(router.allowedMethods());
}).catch(e=>{
  // console.log(33,e)
})
