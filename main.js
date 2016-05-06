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
	Template.dragList.onRendered(function() {
		var debug = false;

		var drake = setupDragula();
		var selectStack = [];
		var dragEle;
		var copyBool;
		var removeEle;
		var selectedPositions = $([]);

		drake.on('dragend', function(el) {recursiveSetup(el)});

		function recursiveSetup(el) {
			moveSelected(el);
			if (el.className.indexOf('row') > -1) {
				drake.destroy();
				drake = setupDragula();
				drake.on('dragend', function(e) {recursiveSetup(e)});
			}
		}

		$(window).on('mousedown', function(e) {select(e);});

		drake.on('remove', function() {removeAllOthers();});

		// Dragula setup
		function setupDragula() {
			return dragula(querySelectorAllArray('.container'),{
				copy: function (el, source) {
					copyBool = source === document.getElementById('left1');
					dragEle = el;

					//saving the original relative positions of the elements before they are moved
					if (!copyBool) {
						selectedPositions = $('[grabbed]');
					}
					
					return copyBool;
				},
			    accepts: function (el, target, source, sibling) {
			        // prevent dragged containers from trying to drop inside itself
					var copySource = document.getElementById('left1');

			        return !contains(el,target) && target !== copySource
			        	&& !isDescendant(copySource, target);
			    },
			    removeOnSpill: true
			});
		}

		function removeAllOthers() {
			$('[grabbed]').each(function() {
				if (this.className.indexOf('gu-mirror') == -1) {
					this.remove();
				}
			});
		}

		function select(e) {
			//TODO prevent shift modifier on cross container
			var target = e.target;
			var className = target.className;
			if (className.indexOf('row') > -1 || className.indexOf('el') > -1) {
				if (e.shiftKey) {
					if (selectStack.length > 0) {
						var lastTarget = selectStack[selectStack.length - 1];
						if (target === lastTarget) {
							return;
						}
						
						var container = $('.container');
						var targetInd = container.find(target).index();
						var lastTargetInd = container.find(lastTarget).index();

						//If the target is after the last target in the page use next else use prev
						if (targetInd > lastTargetInd) {
							$(lastTarget).nextUntil(target).attr('grabbed', 'true');
						} else {
							$(lastTarget).prevUntil(target).attr('grabbed', 'true');
						}
					}

					//Remove the previous index of the target in the stack if it exists.
					var ind = selectStack.indexOf(target);
					if (ind > -1) {
						selectStack.splice(ind, 1);
					}

					target.setAttribute('grabbed', 'true');
					selectStack.push(target);
				} else if (e.ctrlKey) {
					//If grabbed
					if (target.getAttribute('grabbed')) {
						target.removeAttribute('grabbed');

						//remove the target from the select stack
						var ind = selectStack.indexOf(target);
						if (ind > -1) {
							selectStack.splice(ind, 1);
						}
					//If not grabbed
					} else {
						target.setAttribute('grabbed', 'true');
						selectStack.push(target);
					}
				//no modifier
				} else {
					//if not grabbed
					if (!target.getAttribute('grabbed')) {
						$('[grabbed]').removeAttr('grabbed');
						target.setAttribute('grabbed', 'true');

						selectStack = [];
						selectStack.push(target);
					}
				}
			} else {
				if (!(e.shiftKey || e.ctrlKey)) {
					$('[grabbed]').removeAttr('grabbed');
					selectStack = [];
				}
			}
			if (debug) {console.log(selectStack);}
		}

		function moveSelected(target) {
			if (copyBool) {
				$(target).removeAttr('grabbed');
			}

			var before = true;
			var ele;
			var targetInd = selectedPositions.index(target);
			$('[grabbed]').each(function() {
				if (copyBool) {
					if (this === dragEle) {
						before = false;
						return;
					}
				} else {
					if (this === target) {
						return;
					}

					before = true;
					if (selectedPositions.index(this) > targetInd) {
						before = false;
					}
				}

				if (copyBool) {
					ele = $(this).clone();
					ele.removeAttr('grabbed');
				} else {
					ele = $(this);
				}

				if (before) {
					ele.insertBefore(target);
				} else {
					ele.insertAfter(target);
				}
			});

			dragEle = null;
			selectedPositions = $([]);
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
