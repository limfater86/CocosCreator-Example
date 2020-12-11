let MoveVar = require('moveVar');

cc.Class({
    extends: cc.Component,

    properties: {

        doorTileGID: {
            default: 4,
        },

    },

    tryMove: function(){
        this._getParams();
        let mapSize = this._tiledMap.getMapSize();
        this._checkSpeedErr();
        if (this._charAtTileCenter) {
            if (this._charInBoards){
                if (this._currDir != this._nextDir) {
                    if (this.checkNextTile(this._nextDir, this._currTile)){
                        if (this.checkNextTile(this._currDir, this._currTile)) this._charStop();
                    } else this._setCurrDir(this._nextDir);
                } else if (this.checkNextTile(this._currDir, this._currTile)) this._charStop();
            }
            
            if (this._currTile.x < 0) {
                this._charJumpToTile(cc.v2(mapSize.width+1, this._currTile.y));
            } else if (this._currTile.x > mapSize.width){
                this._charJumpToTile(cc.v2(-1, this._currTile.y));
            }
            
        }
        
        this._move();
    },

    _getParams: function(){
        this._speed = this._char.comp.getSpeed();
        this._currDir = this._char.comp.getCurrDir();
        this._nextDir = this._char.comp.getNextDir();
        this._charAtTileCenter = this._char.comp.getTileCenter();
        this._charInBoards = this._char.comp.getInBoards();
        this._currTile = this._char.comp.getCurrTile();
        
    },

    _setCurrDir: function(dir){
        this._currDir = dir;
        this._char.comp.setCurrtDir(dir);
    },

    _move: function (){
        switch(this._currDir) {
            case MoveVar.Dir.DOWN:
                this._char.y -= this._speed;
                break;
            case MoveVar.Dir.UP:
                this._char.y += this._speed;
                break;
            case MoveVar.Dir.RIGHT:
                this._char.x += this._speed; 
                break;
            case MoveVar.Dir.LEFT:
                this._char.x -= this._speed; 
                break;
        }
    },

    checkNextTile: function (dir, tile){
        let nextTile = this._getNextTile(dir, tile);
        let mapSize = this._tiledMap.getMapSize();
        if (nextTile.x < 0 || nextTile.x >= mapSize.width) return false;
        else if ( this._char.name == 'player') {
            let tileGID = this._layerBarrier.getTileGIDAt(nextTile);
            if (this._char.comp.isPlayerHaveKey() && tileGID == this.doorTileGID) return false;
            else return tileGID;
        }
        else {
            let tileGID = this._layerBarrier.getTileGIDAt(nextTile);
            let state = this._char.comp.getState();
            if (state == MoveVar.State.EXIT || state == MoveVar.State.DEAD){
                if (tileGID == this.doorTileGID) return false;
                else return tileGID;
            } else return tileGID;
            
        }
    },

    _getNextTile: function(dir, tile){
        let x=0, y=0;
        
        switch(dir) {
            case MoveVar.Dir.DOWN:
                y = 1;
                break;
            case MoveVar.Dir.UP:
                y = -1;
                break;
            case MoveVar.Dir.RIGHT:
                x = 1;
                break;
            case MoveVar.Dir.LEFT:
                x = -1;
                break;
            default:
                return;
        }
        return tile = cc.v2(tile.x+x, tile.y+y);
    },

    _charStop: function (){
        this._speed = 0;
        this._char.comp.setSpeed(0);
    },

    _charJumpToTile: function(tile){
        let pos = this._layerBarrier.getPositionAt(tile);
        this._char.setPosition(pos);
    },

    _getTilePos: function(posInPixel) {
        let mapSize = this._tiledMap.node.getContentSize();
        let tileSize = this._tiledMap.getTileSize();
        let x = Math.floor(posInPixel.x / tileSize.width);
        let y = Math.floor((mapSize.height - posInPixel.y - tileSize.height) / tileSize.height);
        
        return cc.v2(x, y);
    },

    _checkSpeedErr: function(){
        let currTilePos = this._layerBarrier.getPositionAt(this._currTile);
        let dist = this._char.position.sub(currTilePos).mag();

        if ((dist < this._speed && dist != 0) || (dist % this._speed != 0)) {
            this._char.setPosition(currTilePos);
            this._charAtTileCenter = true;
        }
        
    },
});
