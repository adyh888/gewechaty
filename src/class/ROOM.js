import { say, getWxId } from '@/action/common.js';
import {inviteMember, delMember} from '@/action/room.js'
import {ResponseMsg} from '@/class/MESSAGE.js'
import {Contact} from '@/class/CONTACT.js'
// add lowdb to cache data
// import lowdb from 'lowdb';
// import FileSync from 'lowdb/adapters/FileSync';
// const adapter = new FileSync('db.json');
// const db = lowdb(adapter);
// db.defaults({ rooms: [] }).write();
export class Room {
  constructor(data) {
    console.log(data)
    this.chatroomId = data.chatroomId; // 房间ID
    this.id = data.chatroomId; // 房间ID
    this.topic = data.nickName || ""; // 房间话题
    this.remark = data.remark || ""; // 房间备注
    this.isNotify = Boolean(data.chatRoomNotify)
    this.OwnerId = data.chatRoomOwner
    this.avatar = data.smallHeadImgUrl
  }
  // 实例方法

  async say (textOrContactOrFileOrUrl, ats) { // 回复消息
    const res = await say(textOrContactOrFileOrUrl, this.chatroomId, ats)
    return new ResponseMsg(res)
  }

  on(event, listener) {
    // 绑定事件处理
    console.log(`Event ${event} is listened`);
    return this;
  }

  async add(contact, reason = '') {
    // 添加成员
    let to = getWxId(contact)
    return inviteMember(to, this.chatroomId, reason)
  }

  async del(contact) {
    // 删除成员
    let to = getWxId(contact)
    return delMember(to, this.chatroomId)
  }

  async quit() {
    // 退出房间
    return new Promise((resolve) => {
      console.log("Quit the room");
      resolve();
    });
  }

  async topic(newTopic) {
    // 修改房间话题
    return new Promise((resolve) => {
      this.topic = newTopic;
      console.log(`Room topic changed to: ${newTopic}`);
      resolve();
    });
  }

  async announce(text) {
    // 设定公告
    return new Promise((resolve) => {
      this.announcements = text;
      console.log(`Room announcement: ${text}`);
      resolve();
    });
  }

  async qrcode() {
    // 返回房间的二维码
    return new Promise((resolve) => {
      const qrcode = `QR code for room ${this.id}`;
      console.log(qrcode);
      resolve(qrcode);
    });
  }

  async alias(contact) {
    // 获取成员别名
    return new Promise((resolve) => {
      console.log(`Alias for ${contact}: [alias name]`);
      resolve("[alias name]");
    });
  }

  async has(contact) {
    // 检查房间是否有某个成员
    return new Promise((resolve) => {
      const hasContact = this.members.includes(contact);
      resolve(hasContact);
    });
  }

  async memberAll(query) {
    // 获取符合查询的所有成员
    return new Promise((resolve) => {
      const result = this.members.filter(member => member.includes(query));
      resolve(result);
    });
  }

  async member(queryArg) {
    // 获取单个成员
    return new Promise((resolve) => {
      const result = this.members.find(member => member.includes(queryArg));
      resolve(result || null);
    });
  }

  owner() {
    // 获取房间的拥有者
    return this.ownerContact;
  }

  async avatar() {
    // 返回房间的头像
    return new Promise((resolve) => {
      const avatar = `Avatar for room ${this.id}`;
      console.log(avatar);
      resolve(avatar);
    });
  }

  // 静态方法

  static async create(contactList, topic) {
    // 创建房间
    return new Promise((resolve) => {
      const room = new Room("generated-id", topic);
      room.members = contactList;
      console.log(`Room created with topic: ${topic}`);
      resolve(room);
    });
  }

  static async findAll(query) {
    // 查询符合条件的房间
    return new Promise((resolve) => {
      console.log(`Finding all rooms with query: ${query}`);
      resolve([new Room("1"), new Room("2")]); // 假设返回两个房间
    });
  }

  static async find(query) {
    // 查询单个符合条件的房间
    return new Promise((resolve) => {
      console.log(`Finding room with query: ${query}`);
      resolve(new Room("found-room-id"));
    });
  }
}

