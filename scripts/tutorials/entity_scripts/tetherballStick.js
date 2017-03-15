"use strict";
/* jslint vars: true, plusplus: true, forin: true*/
/* globals Tablet, Script, AvatarList, Users, Entities, MyAvatar, Camera, Overlays, Vec3, Quat, Controller, print, getControllerWorldLocation */
/* eslint indent: ["error", 4, { "outerIIFEBody": 0 }] */
//
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
    var ACTION_TIMESCALE = 0.025;
    var ACTION_TAG = "TetherballStick Action";
    var BALL_NAME = "TetherballStick Ball";
    var LINE_NAME = "TetherballStick Line";
    var COLLISION_SOUND_URL = "http://public.highfidelity.io/sounds/Footsteps/FootstepW3Left-12db.wav";
    var INTERACT_SOUND_URL = "http://hifi-public.s3.amazonaws.com/sounds/color_busters/powerup.wav";
    var INTERACT_SOUND_VOLUME = 0.2;
    var USE_INTERACT_SOUND = false;
    var AVATAR_CHECK_RANGE = 5; // in meters
    var TELEPORT_THRESHOLD = 0.75; // in meters
    var TIP_OFFSET = 0.15;

    tetherballStick = function() {
        _this = this;
        return;
    };

    tetherballStick.prototype = {
        isHeld: false,
        lastReposition: 0,
        lastAvatarPosition: Vec3.ZERO,
        lastCheckForEntities: 0,
        ownerID: NULL_UUID,
        userID: NULL_UUID,
        ballID: NULL_UUID,
        lineID: NULL_UUID,
        actionID: NULL_UUID,
        INTERACT_SOUND: undefined,

        preload: function(entityID) {
            this.entityID = entityID;
            if (USE_INTERACT_SOUND) {
                this.INTERACT_SOUND = SoundCache.getSound(INTERACT_SOUND_URL);
            }
            Script.update.connect(this.update);
        },

        unload: function() {
            Script.update.disconnect(this.update);
        },

        update: function(dt) {
            // _this during update due to loss of scope
            var stickProps = Entities.getEntityProperties(_this.entityID);

            if (_this.lastCheckForEntities >= ENTITY_CHECK_INTERVAL) {
                _this.lastCheckForEntities = 0;
                // everyone will be running this update loop
                // the only action is to increment the timer till ENTITY_CHECK_INTERVAL
                // when that is reached the userdata ownerID is simply validated by everyone
                // if it's invalid call setNewOwner, to set a new valid user
                if (!_this.checkForOwner()) {
                    return;
                }

                // only one person should ever be running this far
                if (_this.ownerID == MyAvatar.sessionUUID) {
                    _this.checkForEntities();
                }
            } else {
                _this.lastCheckForEntities += dt;
            }
        },

        checkForOwner: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            try {
                var stickData = JSON.parse(stickProps.userData);
                var owner = AvatarManager.getAvatar(stickData.ownerID);
                if (owner.sessionUUID !== undefined) {
                    this.ownerID = owner.sessionUUID;
                    return true;
                } else {
                    // UUID is invalid
                    this.setNewOwner();
                    return false;
                }
            } catch (e) {
                // all other errors
                this.setNewOwner();
                return false;
            }
        },

        setNewOwner: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
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
                if (distFrom < closestAvatarDistance) {
                    closestAvatarDistance = distFrom;
                    closestAvatarID = avatarID;
                }
            });

            // add reference to userData
            try {
                var stickData = JSON.parse(stickProps.userData);
                stickData.ownerID = closestAvatarID;
                Entities.editEntity(this.entityID, {
                    userData: JSON.stringify(stickData)
                });
            } catch (e) {
            }
        },

        checkForEntities: function() {
            if (!this.hasBall()) {
                this.createBall();
            }
            if (!this.hasAction()) {
                this.createAction();
            }
        },

        playInteractionSound: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            var INTERACT_SOUND_OPTIONS = {
                volume: INTERACT_SOUND_VOLUME,
                loop: false,
                position: stickProps.position
            };
            Audio.playSound(this.INTERACT_SOUND, INTERACT_SOUND_OPTIONS);
        },

        getTipPosition: function(position, rotation) {
            var frontVec = Quat.getFront(rotation);
            var frontOffset = Vec3.multiply(frontVec, TIP_OFFSET);
            var tipPosition = Vec3.sum(position, frontOffset);
            return tipPosition;
        },

        startNearGrab: function(id, params) {
            var stickProps = Entities.getEntityProperties(this.entityID);
            // set variables from data in case someone else created the components
            try {
                var stickData = JSON.parse(stickProps.userData);
                this.userID = MyAvatar.sessionUUID;
                this.ballID = stickData.ballID;
                this.actionID = stickData.actionID;
                //var hand = params[0];
                //Controller.triggerShortHapticPulse(1, hand);
                this.createLine();
                if (USE_INTERACT_SOUND) {
                    this.playInteractionSound();
                }
                this.isHeld = true;
            } catch (e) { }
        },

        releaseGrab: function(id, params) {
            this.isHeld = false;
            this.userID = NULL_UUID;
            if (USE_INTERACT_SOUND) {
                this.playInteractionSound();
            }
            this.deleteLine();
        },

        continueNearGrab: function(id, params) {
            if (!this.isHeld || !this.hasRequiredComponents()) {
                return;
            }
            // updating every tick seems excessive, so repositioning is throttled here
            if (Date.now() - this.lastReposition >= REPOSITION_INTERVAL) {
                this.lastReposition = Date.now();
                this.repositionAction();
            }
            if (Vec3.distance(this.lastAvatarPosition, MyAvatar.position) > TELEPORT_THRESHOLD) {
                this.settleBall();
            }
            this.lastAvatarPosition = MyAvatar.position;
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
            } catch (e) {}
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

        settleBall: function() {
            Entities.editEntity(this.ballID, {
                velocity: Vec3.ZERO,
                angularVelocity: Vec3.ZERO
            });
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
            } catch (e) {}
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
            var tipPosition = this.getTipPosition(stickProps.position, stickProps.rotation);

            Entities.updateAction(this.ballID, this.actionID, {
                pointToOffsetFrom: tipPosition,
                linearDistance: ACTION_DISTANCE,
                tag: ACTION_TAG,
                linearTimeScale: ACTION_TIMESCALE
            });

            var ballProps = Entities.getEntityProperties(this.ballID);
            var cameraQuat = Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z);
            var linePoints = [];
            var normals = [];
            var strokeWidths = [];
            linePoints.push(this.getTipPosition(Vec3.ZERO, stickProps.rotation));
            normals.push(cameraQuat);
            strokeWidths.push(LINE_WIDTH);
            linePoints.push(Vec3.subtract(ballProps.position, tipPosition));
            normals.push(cameraQuat);
            strokeWidths.push(LINE_WIDTH);

            var lineProps = Entities.getEntityProperties(this.lineID);
            Entities.editEntity(this.lineID, {
                linePoints: linePoints,
                normals: normals,
                strokeWidths: strokeWidths,
                position: tipPosition,
                lifetime: Math.round(lineProps.age + 2)
            });
        }
    };

    // entity scripts should return a newly constructed object of our type
    return new tetherballStick();
});
