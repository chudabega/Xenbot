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
		var drake = setupDragula();

		drake.on('dragend', function (el) {recursiveSetup(el)});

		function recursiveSetup(el) {
			if (el.className.indexOf('row') > -1) {
				drake.destroy();
				drake = setupDragula();
				drake.on('dragend', function(e) {recursiveSetup(e)});
			}
		}

		// Dragula setup
		function setupDragula() {
			return dragula(querySelectorAllArray('.container'),{
				copy: function (el, source) {
					return source === document.getElementById('left1')
				},
			    accepts: function (el, target, source, sibling) {
			        // prevent dragged containers from trying to drop inside itself
					var copyEle = document.getElementById('left1');

			        return !contains(el,target) && target !== copyEle
			        	&& !isDescendant(copyEle, target);
			    },
			    removeOnSpill: true
			});
		}

		function isDescendant(parent, child) {
		     var node = child.parentNode;
		     while (node != null) {
		         if (node == parent) {
		             return true;
		         }
		         node = node.parentNode;
		     }
		     return false;
		}
		// UTILS
		function querySelectorAllArray(selector){
		    return Array.prototype.slice.call(
		        document.querySelectorAll(selector), 0
		    );
		}
		// http://ejohn.org/blog/comparing-document-position/
		function contains(a, b){
		  return a.contains ?
		    a != b && a.contains(b) :
		    !!(a.compareDocumentPosition(b) & 16);
		}
	});


}

if (Meteor.isServer) {
	Meteor.startup(() => {
		Items.remove({});
		if (Items.find({}).count() === 0) {
			Items.insert({name:'Text Box', bgcolor: 'black', color:'red', id:1});
			Items.insert({name:'Drop Down List', bgcolor: 'black', color:'blue', id:2});
			Items.insert({name:'Radio Button', bgcolor: 'black', color:'green', id:3});
			Items.insert({name:'Check Box', color:'orange', id:4});
			Items.insert({name:'Calendar', bgcolor: 'black', color:'yellow', id:5});
			Items.insert({name:'Output Text', color:'purple', id:6});
			Items.insert({name:'Hyper Link', bgcolor: 'black', color:'brown', id:7});
			Items.insert({name:'Suggestion Box', color:'pink', id:8});
			Items.insert({name:'A4J Button', color:'cyan', id:9});
			Items.insert({name:'Command Button', color:'gray', id:10});
			Items.insert({name:'File Upload', id:11});
			Items.insert({name:'Padding', id:12});

			//_(20).times(function(n) {
			//	Items.insert({name:'Item'+n,number:n});
			//});
		}
	});
}
