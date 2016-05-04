import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Items = new Meteor.Collection('items');

if (Meteor.isClient) {
	Template.dragList.helpers({
		items: function(){
			return Items.find({});
		}
	});
	Template.dragList.onRendered(function(){
		dragula([document.getElementById('left1'), document.getElementById('right1')], {
			copy: function (el, source) {
				return source === document.getElementById('left1')
			},
			accepts: function (el, target) {
				return target !== document.getElementById('left1')
			},
			removeOnSpill: true
		});
	});
}

if (Meteor.isServer) {
	Meteor.startup(() => {
		// Items.remove({});
		if (Items.find({}).count() === 0) {
			n = 0;
			Items.insert({name:'Text Box',id:n+1});
			Items.insert({name:'Drop Down List',id:n+1});
			Items.insert({name:'Radio Button',id:n+1});
			Items.insert({name:'Check Box',id:n+1});
			Items.insert({name:'Calendar',id:n+1});
			Items.insert({name:'Output Text',id:n+1});
			Items.insert({name:'Hyper Link',id:n+1});
			Items.insert({name:'Suggestion Box',id:n+1});
			Items.insert({name:'A4J Button',id:n+1});
			Items.insert({name:'Command Button',id:n+1});
			Items.insert({name:'File Upload',id:n+1});
			Items.insert({name:'Padding',id:n+1});

			//_(20).times(function(n) {
			//	Items.insert({name:'Item'+n,number:n});
			//});
		}
	});
}
