// 完整示例
const {
  GeweBot,
  Filebox,
  UrlLink,
  WeVideo,
  Voice,
  MiniApp,
  AppMsg
} = require("./dist/index.js");

const bot = new GeweBot({
  debug: true, // 是否开启调试模式 默认false
  base_api: process.env.WEGE_BASE_API_URL, // Gewechat启动后的基础api地址base_api 默认为 `http://本机ip:2531/v2/api`
  file_api: process.env.WEGE_FILE_API_URL, // Gewechat启动后的文件api地址base_api 默认为 `http://本机ip:2532/download`,
});

// 监听消息事件
const onMessage = async (msg) => {
  // 处理消息...
  // 回复文本消息
  if (msg.type() === bot.Message.Type.Text) { //类型详见 MessageType 表
    await msg.say("Hello, World!");
  }
  // 处理图片消息
  if (msg.type() === bot.Message.Type.Image) {
    await msg.say("收到图片");
  }
};

bot.on("message", (msg) => {
  // 此处放回的msg为Message类型 可以使用Message类的方法
  onMessage(msg);
});

bot.on('friendship', (friendship) => { // 根据请求内容自动通过好友请求
                                       // type() 方法与wechaty不同 返回内容为场景值
  const scene = friendship.type() // 获取场景 3 ：微信号搜索  4 ：QQ好友  8 ：来自群聊  15：手机号
  if(friendship.hello() === 'ding' && scene === 15){ // 打招呼消息为ding 且是通过手机号添加的好友 则自动通过
    friendship.accept()
  }
})

bot.on('room-invite', async roomInvitation => { // 接受群邀请
  try {
    await roomInvitation.accept()
  } catch (e) {
    console.error(e)
  }
})

bot.on('all', msg => { // 如需额外的处理逻辑可以监听 all 事件 该事件将返回回调地址接收到的所有原始数据
  console.log('received all event.')
})

// 扫码事件 如果需要获取二维码内容展示到其他地方的时候可以使用，一般不需要，已经在命令行中展示了需要扫码的二维码
bot.on('scan', qrcode => { // 需要用户扫码时返回对象qrcode.content为二维码内容 qrcode.url为转化好的图片地址
  console.log(qrcode.content)
})

bot
  .start()
  .then(async ({app, router}) => {
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
      const contact = await bot.Contact.find({name: 'test'}) // 获取联系人
      contact.say(text)
      ctx.body = '发送成功'
    })
    app.use(router.routes()).use(router.allowedMethods());

    // 通过bot实例做相关操作
    const info = await bot.info() // 获取当前登录微信的个人信息
    console.log(info)

    const qrcode = await bot.qrcode() // 获取当前登录微信的二维码 base64
    console.log(qrcode)

    await bot.setInfo({ // 当前登录微信的设置个人信息
      "city": "Fuzhou", // 城市
      "country": "CN", // 国家
      "nickName": "test", //昵称
      "province": "Fujian", //省份
      "sex": 1, //性别 1:男 2:女
      "signature": "......" // 个性签名
    })

    // 设置隐私
    // 4:加我为朋友时需要验证  7:向我推荐通讯录朋友 8:添加我的方式 手机号 25:添加我的方式 微信号 38:添加我的方式 群聊 39:添加我的方式 我的二维码 40:添加我的方式 名片
    await bot.setPrivacy({
      option: 4, //
      open: true //开关
    })

    // 设置头像
    await bot.setAvatar('https://wx.qlogo.cn/mmhead/ver_1/REoLX7KfdibFAgDbtoeXGNjE6sGa8NCib8UaiazlekKjuLneCvicM4xQpuEbZWjjQooSicsKEbKdhqCOCpTHWtnBqdJicJ0I3CgZumwJ6SxR3ibuNs/0') // 设置头像

    const list = await bot.deviceList() // 获取设备记录
    console.log(list)


    // 通过手机号添加好友
    const contact = await bot.Friendship.search('150*******4')
    bot.Friendship.add(contact, 'ding')

    // 查找联系人方法
    const friend = await bot.Contact.find({name: 'test'}) // 使用昵称查询
    const friend2 = await bot.Contact.find({alias: 'test1'}) // 使用备注查询
    const friend3 = await bot.Contact.find({id: 'wxid_xxxxx'}) // 直接使用wxid查询
    friend && friend.say('hello') // 给查询到的联系人发送消息

    // // 创建群
    // const room = await bot.Room.create([friend, friend2], '测试群22')
    // room.say('hello')
    //
    // // 退出群
    // const room = await bot.Room.find({topic: '测试群22'})
    // room && room.quit()
    //
    // // 同步群信息到缓存 例如修改了群名称等
    // const room = await bot.Room.find({topic: '测试群4'}) // 下载群头像
    // const r = await room.sync() // 返回更新后的 Room 类
    //
    // // 获取群二维码
    // const room = await bot.Room.find({topic: '测试群4'})
    // const {qrBase64, qrTips} = await room.qrcode() // base64
    // console.log(qrBase64)
    //
    // const avatar = await room.avatar() // 获取群头像
    // avatar.toFile('path/to/download/avatar.jpg') // 保存群头像到本地
    //
    // room.say('test', [friend, friend2]) // 通知指定成员
    //
    // room.say('test', '@all') // 通知全员


    // 监听群消息
    // 注意！！ 首次启动监听群消息的群需要保存该群到通讯录，否则无法在启动时获取群信息导致获取群信息失败，无法监听！！！
    // const room = await bot.Room.find({topic: '测试群4'})
    // if(room){
    //   room.on('join', async (room, contact) => {
    //     const friend = await bot.Friendship.search(contact._wxid)
    //     const urlLink = new UrlLink({
    //       title: `${contact._name}加入了群聊`,
    //       desc: `微信号：${contact._wxid}`,
    //       thumbUrl: `${friend.bigHeadImgUrl}`, // 可以通过search方法获取用户头像
    //       linkUrl: 'https://www.baidu.com'
    //     })
    //     room.say(urlLink)
    //   })
    //   room.on('leave', async (room, contact) => {
    //     const friend = await bot.Friendship.search(contact._wxid)
    //     const urlLink = new UrlLink({
    //       title: `${contact._name}退出了群聊`,
    //       desc: `微信号：${contact._wxid}`,
    //       thumbUrl: `${friend.bigHeadImgUrl}`,
    //       linkUrl: 'https://www.baidu.com'
    //     })
    //     room.say(urlLink)
    //   })
    //   room.on('topic', (room, newTopic, oldTopic) => {
    //     room.say(`群名由“${oldTopic}”换成了“${newTopic}”`, '@all')
    //   })
    // }


  })
  .catch((e) => {
    console.error(e);
  });
