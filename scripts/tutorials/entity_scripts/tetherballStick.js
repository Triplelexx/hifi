"use strict";

/*jslint nomen: true, vars: true, plusplus: true*/
/*global Entities, Vec3, MyAvatar, Camera, Script, print*/

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
    var TETHER_LENGTH = 0.5;
    var TETHER_TIMESCALE = 0.01;
    var TETHER_WIDTH = 0.02;

    tetherballStick = function() {
        _this = this;
        return;
    };

    tetherballStick.prototype = {
        equipped: false,
        lastReposition: 0,

        preload: function(entityID) {
            this.entityID = entityID;
            // I have been using update and grab scripts to test without hand controllers
            // Script.update.connect(this.update);
        },

        unload: function() {
            // Script.update.disconnect(this.update);
        },

        update: function(dt) {
            var dataProps = Entities.getEntityProperties(_this.entityID);
            if (dataProps.userData) {
                try {
                    var data = JSON.parse(dataProps.userData);
                    if(data.userID == MyAvatar.sessionUUID && _this.hasBall()) {
                        // updating every tick seems excessive, so repositioning is throttled here
                        if(Date.now() - _this.lastReposition >= REPOSITION_INTERVAL) {
                            _this.lastReposition = Date.now();
                            _this.repositionTether();
                        }
                    }
                } catch (e) {
                }
            }
        },

        startEquip: function(id, params) {
            this.equipped = true;
        },

        continueEquip: function(id, params) {
            if (!this.equipped || !this.hasBall()) {
                return;
            }
            // updating every tick seems excessive, so repositioning is throttled here
            if(Date.now() - this.lastReposition >= REPOSITION_INTERVAL) {
                this.lastReposition = Date.now();
                this.repositionTether();
            }
        },

        releaseEquip: function(id, params) {
            this.equipped = false;
        },

        hasBall: function() {
            var dataProps = Entities.getEntityProperties(this.entityID);
            if (dataProps.userData) {
                try {
                    var data = JSON.parse(dataProps.userData);
                    return data.ballID != NULL_UUID && data.ballID.length == NULL_UUID.length;
                } catch (e) {
                    return false;
                }
            }
        },

        repositionTether: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            if (stickProps.userData) {
                try {
                    var stickData = JSON.parse(stickProps.userData);

                    Entities.updateAction(stickData.ballID, stickData.actionID, {
                        pointToOffsetFrom: stickProps.position,
                        linearDistance: TETHER_LENGTH,
                        linearTimeScale: TETHER_TIMESCALE
                    });

                    var ballProps = Entities.getEntityProperties(stickData.ballID);
                    var linePoints = [];
                    var normals = [];
                    var strokeWidths = [];
                    linePoints.push(Vec3.ZERO);
                    normals.push(Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z));
                    strokeWidths.push(TETHER_WIDTH);
                    linePoints.push(Vec3.subtract(ballProps.position, stickProps.position));
                    normals.push(Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z));
                    strokeWidths.push(TETHER_WIDTH);

                    Entities.editEntity(stickData.lineID, {
                        linePoints: linePoints,
                        normals: normals,
                        strokeWidths: strokeWidths,
                        position: stickProps.position
                    });
                } catch (e) {
                }
            }
        }
    };

    return new tetherballStick();
});
