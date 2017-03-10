"use strict";

/*jslint nomen: true, vars: true, plusplus: true*/
/*global Entities, Vec3, MyAvatar, AvatarList, Controller, Camera, Script, print*/

// tetherballStick.js
//
// Created by Triplelexx on 17/03/04
// Copyright 2017 High Fidelity, Inc.
//
// Entity script for an equippable stick with a tethered ball
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function() {
    var _this;

    var NULL_UUID = "{00000000-0000-0000-0000-000000000000}";
    var REPOSITION_INTERVAL = 30; // time in ms
    var ENTITY_CHECK_INTERVAL = 5; // time in sec
    var LINE_WIDTH = 0.02;
    var BALL_SIZE = 0.175;
    var BALL_DAMPING = 0.5;
    var BALL_ANGULAR_DAMPING = 0.5;
    var BALL_RESTITUTION = 0.4;
    var BALL_DENSITY = 1000;
    var ACTION_DISTANCE = 0.25;
    var ACTION_DISTANCE_INCREMENT = 0.005;
    var ACTION_TIMESCALE = 0.025;
    var ACTION_TAG = "tetherballStick Action";
    var BALL_NAME = "tetherballStick Ball";
    var LINE_NAME = "tetherballStick Line";
    var COLLISION_SOUND_URL = "http://public.highfidelity.io/sounds/Footsteps/FootstepW3Left-12db.wav";
    var EQUIP_SOUND_URL = "http://hifi-public.s3.amazonaws.com/sounds/color_busters/powerup.wav";
    var EQUIP_SOUND_VOLUME = 0.2;
    var AVATAR_CHECK_RANGE = 5; // in meters

    tetherballStick = function() {
        _this = this;
        return;
    };

    tetherballStick.prototype = {
        isEquipped: false,
        lastReposition: 0,
        lastCheckForEntity: 0,
        lineLength: 0,
        userID: NULL_UUID,
        ballID: NULL_UUID,
        lineID: NULL_UUID,
        actionID: NULL_UUID,
        EQUIP_SOUND: undefined,

        preload: function(entityID) {
            this.entityID = entityID;
            this.EQUIP_SOUND = SoundCache.getSound(EQUIP_SOUND_URL);
            Script.update.connect(this.update);
        },

        unload: function() {
            Script.update.disconnect(this.update);
        },

        update: function(dt) {
            // _this during update due to loss of scope
            var stickProps = Entities.getEntityProperties(_this.entityID);
            if (_this.lastCheckForEntity >= ENTITY_CHECK_INTERVAL) {
                // I only want the closest client to be in charge of creating objects.
                // the AvatarList also contains a null representing MyAvatar,
                // a new array is created to start with containing the proper UUID 
                var avatarList = AvatarList.getAvatarIdentifiers()
                    .filter(Boolean) // remove the null
                    .concat(MyAvatar.sessionUUID); // add the ID

                var closestAvatarID = undefined;
                var closestAvatarDistance = AVATAR_CHECK_RANGE;
                avatarList.forEach(function(avatarID) {
                    var avatar = AvatarList.getAvatar(avatarID);
                    var distFrom = Vec3.distance(avatar.position, stickProps.position);
                    if (distFrom < closestAvatarDistance && distFrom > 0) {
                        closestAvatarDistance = distFrom;
                        closestAvatarID = avatarID;
                    }
                });

                var isAuthAvatar = closestAvatarID == MyAvatar.sessionUUID;
                if (isAuthAvatar) {
                    _this.checkForEntities();
                    _this.lastCheckForEntity = 0;
                }    
            } else {
                _this.lastCheckForEntity += dt;
            }
            
            /* Was shrinking and growing line, decided against enabling it
            var isUser = _this.userID == MyAvatar.sessionUUID; // only the user should control the line
            if (_this.isEquipped && _this.lineLength < ACTION_DISTANCE && isUser) { // increase line after startEquip
                _this.lineLength += ACTION_DISTANCE_INCREMENT;
            } else if (!_this.isEquipped && _this.lineLength > 0 && isUser) { // reduce lineLength after releaseEquip
                _this.lineLength -= ACTION_DISTANCE_INCREMENT;
            } else if (!_this.isEquipped && _this.lineLength <= 0 && isUser) {
                _this.userID = NULL_UUID;
            }
            */
        },

        checkForEntities: function() {
            if (!this.hasBall()) {
                this.createBall();
            }
            if (!this.hasAction()) {
                this.createAction();
            }
        },

        playEquipSound: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            var EQUIP_SOUND_OPTIONS = {
                volume: EQUIP_SOUND_VOLUME,
                loop: false,
                position: stickProps.position
            };
            Audio.playSound(this.EQUIP_SOUND, EQUIP_SOUND_OPTIONS);
        },

        startEquip: function(id, params) {
            var stickProps = Entities.getEntityProperties(this.entityID);
            // set variables from data in case someone else created the components
            try {
                var stickData = JSON.parse(stickProps.userData);
                this.userID = MyAvatar.sessionUUID;
                this.ballID = stickData.ballID;
                this.actionID = stickData.actionID;
                var hand = params[0];
                Controller.triggerShortHapticPulse(1, hand);
                this.createLine();
                this.playEquipSound();
                this.isEquipped = true;
            } catch (e) {
            }
        },

        continueEquip: function(id, params) {
            if (!this.isEquipped || !this.hasRequiredComponents()) {
                return;
            }
            // updating every tick seems excessive, so repositioning is throttled here
            if (Date.now() - this.lastReposition >= REPOSITION_INTERVAL) {
                this.lastReposition = Date.now();
                this.repositionAction();
            }
        },

        releaseEquip: function(id, params) {
            this.isEquipped = false;
            this.userID = NULL_UUID;
            this.playEquipSound();
            this.deleteLine();
        },

        createLine: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            this.lineID = Entities.addEntity({
                type: "PolyLine",
                name: LINE_NAME,
                color: {
                    red: 0,
                    green: 120,
                    blue: 250
                },
                textures: "https://hifi-public.s3.amazonaws.com/alan/Particles/Particle-Sprite-Smoke-1.png",
                position: stickProps.position,
                dimensions: {
                    x: 10,
                    y: 10,
                    z: 10
                }
            });
            this.lineLength = 0;
        },

        deleteLine: function() {
            Entities.deleteEntity(this.lineID);
            this.lineID = NULL_UUID;
        },

        hasLine: function() {
            var lineProps = Entities.getEntityProperties(this.lineID);
            return lineProps.name == LINE_NAME;
        },

        createBall: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);

            this.ballID = Entities.addEntity({
                type: "Model",
                modelURL: "http://hifi-content.s3.amazonaws.com/Examples%20Content/production/marblecollection/Star.fbx",
                name: BALL_NAME,
                shapeType: "Sphere",
                position: stickProps.position,
                lifetime: 3600,
                collisionSoundURL: COLLISION_SOUND_URL,
                dimensions: {
                    x: BALL_SIZE,
                    y: BALL_SIZE,
                    z: BALL_SIZE
                },
                gravity: {
                    x: 0.0,
                    y: -9.8,
                    z: 0.0
                },
                damping: BALL_DAMPING,
                angularDamping: BALL_ANGULAR_DAMPING,
                density: BALL_DENSITY,
                restitution: BALL_RESTITUTION,
                dynamic: true,
                collidesWith: "static,dynamic,otherAvatar,",
                grabbable: false,
                userData: JSON.stringify({
                    grabbableKey: {
                        grabbable: false
                    }
                })
            });

            // add reference to userData
            try {
                var stickData = JSON.parse(stickProps.userData);
                stickData.ballID = this.ballID;
                Entities.editEntity(this.entityID, {
                    userData: JSON.stringify(stickData)
                });
            } catch (e) {   
            }
        },

        hasBall: function() {
            // validate the userData to handle unexpected item deletion
            var stickProps = Entities.getEntityProperties(this.entityID);
            try {
                var data = JSON.parse(stickProps.userData);
                var ballProps = Entities.getEntityProperties(data.ballID);
                return ballProps.name == BALL_NAME;
            } catch (e) {
                return false;
            }
        },

        createAction: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);

            this.actionID = Entities.addAction("offset", this.ballID, {
                pointToOffsetFrom: stickProps.position,
                linearDistance: ACTION_DISTANCE,
                tag: ACTION_TAG,
                linearTimeScale: ACTION_TIMESCALE
            });

            // add reference to userData
            try {
                var stickData = JSON.parse(stickProps.userData);
                stickData.actionID = this.actionID;
                Entities.editEntity(this.entityID, {
                    userData: JSON.stringify(stickData)
                });
            } catch (e) {            
            }
        },

        hasAction: function() {
            // validate the userData to handle unexpected item deletion
            var stickProps = Entities.getEntityProperties(this.entityID);
            try {
                var stickData = JSON.parse(stickProps.userData);
                var actionProps = Entities.getActionArguments(stickData.ballID, stickData.actionID);
                return actionProps.tag == ACTION_TAG;
            } catch (e) {
                return false;
            }
        },

        hasRequiredComponents: function() {
            return this.hasBall() && this.hasAction() && this.hasLine();
        },

        repositionAction: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);

            Entities.updateAction(this.ballID, this.actionID, {
                pointToOffsetFrom: stickProps.position,
                linearDistance: ACTION_DISTANCE,
                tag: ACTION_TAG,
                linearTimeScale: ACTION_TIMESCALE
            });

            var ballProps = Entities.getEntityProperties(this.ballID);
            var cameraQuat = Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z);
            var linePoints = [];
            var normals = [];
            var strokeWidths = [];
            linePoints.push(Vec3.ZERO);
            normals.push(cameraQuat);
            strokeWidths.push(LINE_WIDTH);
            linePoints.push(Vec3.subtract(ballProps.position, stickProps.position));
            normals.push(cameraQuat);
            strokeWidths.push(LINE_WIDTH);

            var lineProps = Entities.getEntityProperties(this.lineID);
            Entities.editEntity(this.lineID, {
                linePoints: linePoints,
                normals: normals,
                strokeWidths: strokeWidths,
                position: stickProps.position,
                lifetime: Math.round(lineProps.age + 2)
            });
        }
    };

    // entity scripts should return a newly constructed object of our type
    return new tetherballStick();
});
