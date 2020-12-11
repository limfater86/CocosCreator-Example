let MoveVar = require("moveVar");
let Player = require("player");

cc.Class({
    extends: cc.Component,

    properties: {
        charAnim: {
            default: null,
            type: cc.Animation
        },
        char: {
            default: null,
            type: Player
        },

    },

    onLoad: function () {
        this.anim = this.charAnim;
        this.deathAnim = false;
        this._clip = '';
    },

    update: function () {
        if (this.char.isDead) this.death();
        else this.movement();
    },

    movement: function(){
        if (this.deathAnim) this.deathAnim = false;
        let _currDir = this.char.getCurrDir();
        if (this.char.getSpeed() != 0){
            if (this.prevDir != _currDir){
                //let clip = '';
                switch(_currDir) {
                    case MoveVar.Dir.DOWN:
                        this._clip = `pac-down`;
                        break;
                    case MoveVar.Dir.UP:
                        this._clip = `pac-up`;
                        break;
                    case MoveVar.Dir.RIGHT:
                        this._clip = `pac-right`;
                        break;
                    case MoveVar.Dir.LEFT:
                        this._clip = `pac-left`;
                        break;
                    default:
                        return;
                }
                this.anim.play(this._clip);
                this.prevDir = _currDir;
            } else this.anim.resume(this._clip);
            
        } else this.anim.pause(this._clip);
    },

    death: function(){
        if (!this.deathAnim) {
            this.deathAnim = true;
            this.anim.play('pac-die');
        }
    }

});
