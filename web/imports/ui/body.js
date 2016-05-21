import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'

import { Data } from '../api/data.js';
import  './webrtc.js';


import './body.html';

Session.set("showVideo", true);
Session.set("showCurrentMeasurement", false);
Session.set("showHistory", false);


Template.body.helpers({
  data() {
    return Data.find();
  },
  showVideo() {
    return Session.get("showVideo")
  },
  showCurrentMeasurement() {
    return Session.get("showCurrentMeasurement")
  },
  showHistory() {
    return Session.get("showHistory")
  }


});

Template.body.events({
  'click #showVideo'(event) {
    Session.set("showVideo", true);
    Session.set("showCurrentMeasurement", false);
    Session.set("showHistory", false);
    console.log('video')
  },
  'click #showhistory'(event) {
    Session.set("showVideo", false);
    Session.set("showCurrentMeasurement", false);
    Session.set("showHistory", true);
    console.log('history')
  },
  'click #showcurrentmeasurement'(event) {
    Session.set("showVideo", false);
    Session.set("showCurrentMeasurement", true);
    Session.set("showHistory", false);
    console.log('measurement')
  }
});

Template.record.helpers({
  showVideo() {
    return Session.get("showVideo")
  },
  showCurrentMeasurement() {
    return Session.get("showCurrentMeasurement")
  },
  showHistory() {
    return Session.get("showHistory")
  }

});