import * as data from './data';

import io from 'socket.io-client';
import { Obj } from './data/object';
import { drawBackground } from './lib/draw';

export var Socket = io();

export default class System {
    constructor() {
        this.cv = document.getElementById("canvas");
        this.ctx = this.cv.getContext("2d");

        this.uicv = document.createElement("canvas");
        this.uictx = this.uicv.getContext("2d");

        this.objectList = [];
        this.uiList = [];

        this.gameSetting = {
            "gamemode": "sandbox",
            "gameset": "Gaming",
        };

        this.playerSetting = {
            "id": -1,
            "level": 0,
            "isCanRotate": false,
            "stat": 0,
            "stats": [],
            "maxStats": [],
        };

        this.input = {
            "moveVector": {x:0,y:0},
        }

        this.lastTime = Date.now();
        this.isControlRotate = true;

        this.camera = {
            x: 0,
            y: 0,
            z: 2,
            uiz: 1,
        }

        this.area = [{X:0,Y:0,W:0,H:0}];

        this.keys = {};
        this.sameKeys = {
            65:37,
            87:38,
            68:39,
            83:40,
        };

        window.input = {
            blur:function(){},
            execute:function(v){},
            flushInputHooks: function(){},
            get_convar:function(key){},
            keyDown: function(){
                if (this.sameKeys[arguments[0]]) arguments[0]=this.sameKeys[arguments[0]];
                if (this.keys[arguments[0]]) return;
                this.keys[arguments[0]] = true;
                let key = "";
                switch (arguments[0]){
                    case 1:
                    case 32:
                        key = "mouseleft";
                        break;
                    case 3:
                    case 16:
                        key = "mouseright";
                        break;
                    case 37:
                        this.input.moveVector.x-=1;
                        key = "moveVector";
                        break;
                    case 38:
                        this.input.moveVector.y-=1;
                        key = "moveVector";
                        break;
                    case 39:
                        this.input.moveVector.x+=1;
                        key = "moveVector";
                        break;
                    case 40:
                        this.input.moveVector.y+=1;
                        key = "moveVector";
                        break;
                    default:
                        break;
                }
                let value = true;
                switch (key){
                    case "mouseleft":
                        value = this.keys[1] || this.keys[32];
                        break;
                    case "mouseright":
                        value = this.keys[3] || this.keys[16];
                        break;
                    case "moveVector":
                        if (this.input.moveVector.x === 0 && this.input.moveVector.y === 0) value = 9;
                        else value = Math.atan2(this.input.moveVector.y,this.input.moveVector.x);
                        break;
                    default:
                        break;
                }
                Socket.emit(key, value);
            }.bind(this),
            keyUp:function(){
                if (this.sameKeys[arguments[0]]) arguments[0]=this.sameKeys[arguments[0]];
                if (!this.keys[arguments[0]]) return;
                this.keys[arguments[0]] = false;
                let key = "";
                switch (arguments[0]){
                    case 1:
                    case 32:
                        key = "mouseleft";
                        break;
                    case 3:
                    case 16:
                        key = "mouseright";
                        break;
                    case 37:
                        this.input.moveVector.x+=1;
                        key = "moveVector";
                        break;
                    case 38:
                        this.input.moveVector.y+=1;
                        key = "moveVector";
                        break;
                    case 39:
                        this.input.moveVector.x-=1;
                        key = "moveVector";
                        break;
                    case 40:
                        this.input.moveVector.y-=1;
                        key = "moveVector";
                        break;
                    default:
                        break;
                }
                let value = false;
                switch (key){
                    case "mouseleft":
                        value = this.keys[1] || this.keys[32];
                        break;
                    case "mouseright":
                        value = this.keys[3] || this.keys[16];
                        break;
                    case "moveVector":
                        if (this.input.moveVector.x === 0 && this.input.moveVector.y === 0) value = 9;
                        else value = Math.atan2(this.input.moveVector.y,this.input.moveVector.x);
                        break;
                    default:
                        break;
                }
                Socket.emit(key, value);
            }.bind(this),
            mouse:function(){
                Socket.emit("mousemove",
                arguments[0]/this.camera.z+this.camera.x,
                arguments[1]/this.camera.z+this.camera.y);
            }.bind(this),
            prevent_right_click: function(){
                return true;
            },
            print_convar_help: function(){},
            set_convar: function(key,value){},
            should_prevent_unload: function(){
                return true;
            },
            wheel: function(){}.bind(this),
        };

        Socket.emit("login");

        Socket.on("playerSet", function (data, camera) {
            this.playerSetting = data;

            if (this.cv.width <= this.cv.height/9*16){
                this.camera.z = this.cv.height / 900;
            } else {
                this.camera.z = this.cv.width / 1600;
            } 

            this.camera.uiz = this.camera.z;

            this.camera.z *= camera.Z;

            this.camera.x = camera.Pos.X - this.cv.width / 2 / this.camera.uiz / camera.Z;
            this.camera.y = camera.Pos.Y - this.cv.height / 2 / this.camera.uiz / camera.Z;
        }.bind(this));

        Socket.on("objectList", function (list) {
            list.forEach((obj) => {
                
                let isObjEnable = false;
                
                this.objectList.forEach((obi) => {
                    if (obi.id === obj.id){
                        obi.ObjSet(obj);
                        isObjEnable = true;
                    }
                });
                if (!isObjEnable && !obj.isDead) {
                    let obi = new Obj(obj.id);
                    obi.ObjSet(obj);
                    this.objectList.push(obi);
                }
            });
            this.objectList.forEach((obj) => {
                if (!obj.isEnable) this.RemoveObject(obj.id);
                obj.isEnable = false;
            })
        }.bind(this));

        Socket.on("area", function (area) {
            this.area = area;
        }.bind(this));
    }

    insertComma = (number) => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    loop() {
        const tick = Date.now() - this.lastTime;
        this.lastTime = Date.now();

        this.uicv.width = this.cv.width;
        this.uicv.height = this.cv.height;

        switch (this.gameSetting.gameset){
            case "Connecting":
                break;
            case "Gaming":
                drawBackground(this.ctx, this.camera.x, this.camera.y, this.camera.z, this.cv.width, this.cv.height, this.area);

                this.objectList.forEach((o) => {
                    o.Animate(tick);
                    o.Draw(this.ctx, this.camera);
                });

                this.objectList.forEach((o) => {
                    o.DrawHPBar(this.ctx, this.camera);
                });

                this.uiList.forEach((ui) => {
                    ui.Draw(this.uictx);
                });
                break;
            default:
                break;
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    RemoveObject(id) {
        for (let i=0;i<this.objectList.length;i++){
            if (this.objectList[i].id === id){
                this.objectList.splice(i,1);
            }
        }
    }
}