import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Items = new Meteor.Collection('items');
Pages = new Meteor.Collection('pages');
Elements = new Meteor.Collection('elements');
Events = new Meteor.Collection('events');
Validators = new Meteor.Collection('validators');
Converters = new Meteor.Collection('converters');

db = {
	element: Elements
};

if (Meteor.isClient) {
	Template.registerHelper('compare', function(v1, v2) {
	  if (typeof v1 === 'object' && typeof v2 === 'object') {
	    return _.isEqual(v1, v2); // do a object comparison
	  } else {
	    return v1 === v2;
	  }
	});

	var debug = false;
	var pageName = 'Quick Contractor Questionnaire';

	Template.dragList.helpers({
		items: function() {
			return Items.find({});
		},
		page: function() {
			return Pages.find({name: pageName});
		},
		elements: function() {
			var page = Pages.findOne({name: pageName});

			if (!page) {
				return;
			}

		 	return page.elements;
		}

	});

	Template.element.rendered = function() {
		dragulaSetup();
	}

	Template.element.helpers({
		eleItems: function() {
			return Elements.find({type: 'item'});
		}
	});

	Template.element.events({
  		"change select": function(e, t) {
			// e.preventDefault();
			// startTransaction();

			// var ele = findEleByObj(this);

			// var eTypeId = e.target.value;
			// var element = Elements.findOne({eTypeId: eTypeId});

			// ele['eTypeId'] = eTypeId;
			// ele['eTypeName'] = element.eTypeName;

			// commitTransaction();
			updateEleProperty(e, this);
		},
		"change input": function(e, t) {
			updateEleProperty(e, this);
		},
	});

	function updateEleProperty(e, obj) {
		e.preventDefault();
		startTransaction();

		var ele = findEleByObj(obj);

		var target = e.target;
		var prop = target.name;
		var value = target.value

		if (target.type == 'text') {
			ele[prop] = value;
		} else if (e.target.type == "select-one") {
			var propId = prop + "Id";
			var propName = prop + "Name";

			var criteria = {};
			criteria[propId] = value;

			var doc = db[prop].findOne(criteria);

			ele[propId] = value;
			ele[propName] = doc[propName];
		}

		commitTransaction();
	}

	function dragulaSetup() {
		if (typeof drake != "undefined") {
			drake.destroy();
		}
		drake = dragulaConfig();
		drake.on('dragend', function(e) {recursiveSetup(e)});
		drake.on('remove', function() {removeAll();});
	}

	var drake;
	var selectedPositions = $([]);

	// Dragula setup
	function dragulaConfig() {
		return dragula(querySelectorAllArray('.panel'), {
			copy: function (el, source) {
				copyBool = source === document.getElementById('itemMenu');
				dragEle = el;

				//saving the original relative positions of the elements before they are moved
				//if (!copyBool) {
					selectedPositions = $('[grabbed]');
				//}
				
				return copyBool;
			},
		    accepts: function (el, target, source, sibling) {
		        // prevent dragged containers from trying to drop inside itself
				var copySource = document.getElementById('itemMenu');

		        return !contains(el,target) && target !== copySource
		        	&& !isDescendant(copySource, target);
		    },
		    removeOnSpill: true,
			direction: 'vertical'
		});
	}

	function recursiveSetup(el) {
		//If there is something selected then perform the move
		if ($('[grabbed]').length) {
			moveSelected(el);
		}

		//what if dragging an item and a container into another container?
		//That nested container will fail meaning you need to check for the existence of a nested container.
		//What if removing a container? The old container is still a part of dragula will that cause an issue?
		//if (el.className.indexOf('panelGrab') > -1) {
			dragulaSetup();
		//}
	}

	function querySelectorAllArray(selector){
	    return Array.prototype.slice.call(
	        document.querySelectorAll(selector), 0
	    );
	}

	function getKeysByValue(obj, value) {
		var keyArr = [];
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop) ) {
	             if(obj[prop] === value) {
	                 keyArr.push(prop);
	             }
	        }
	    }
	    return keyArr;
	}

	// http://ejohn.org/blog/comparing-document-position/
	function contains(a, b){
	  return a.contains ?
	    a != b && a.contains(b) :
	    !!(a.compareDocumentPosition(b) & 16);
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

	var page;

	function getIndex(_id, eles) {
		var indexes = $.map(eles, function(e, index) {
		    if(e._id == _id) {
		        return index;
		    }
		});

		var ind = indexes[0];

		return ind;
	}

	function getParentArray(_id) {
		var eles = page.elements;

		var elementMap = page.eleMap;

		var par_id = elementMap[_id];
		var prev_id;
		var eleArr = [];
		while(par_id != null) {
			prev_id = par_id;
			par_id = elementMap[par_id];
			eleArr.splice(0, 0, prev_id);
		}

		for (var i = 0; i < eleArr.length; i++) {
			eles = $.grep(eles, function(e) {return e._id == eleArr[i];})[0].elements;
		}

		return eles;
	}

	function getElementArray(_id) {
		var eles = getParentArray(_id);
		var ind = getIndex(_id, eles);

		return eles[ind].elements;
	}

	function findEleByObj(o) {
		var ele_id = o._id;
		var eles = getParentArray(ele_id);
		var ind = getIndex(ele_id, eles);
		var ele = eles[ind];
		return ele;
	}

	// function findEle(e) {
	// 	var pageEle = $(e).closest('.element')[0];
	// 	var ele_id = pageEle.getAttribute('_id');
	// 	var eles = getParentArray(ele_id);
	// 	var ind = getIndex(ele_id, eles);
	// 	var ele = eles.get(ind);
	// 	return ele;
	// }

	function deleteEle(e) {
		//Remove an element from the page's element hierarchy
		var ele_id = e.getAttribute('_id');
		var eles = getParentArray(ele_id);
		var ind = getIndex(ele_id, eles);
		var ele = eles.splice(ind, 1)[0];

		delete page.eleMap[ele_id];
		
		return ele;
	}

	function deleteEleMapChildren(e) {
		var ele_id = e.getAttribute('_id');

		var keyArr = getKeysByValue(page.eleMap, parseInt(ele_id));

		while (keyArr.length > 0) {
			keyArr = keyArr.concat(getKeysByValue(page.eleMap, parseInt(keyArr[0])));
			delete page.eleMap[keyArr[0]];
			keyArr.splice(0, 1);
		}
	}

	function updateEle(e) {
		//Remove the element from the database
		if (debug) {console.log("Element: " + e.getAttribute('_id'));}

		logFirstLevelIds("Update Start");
		var ele = deleteEle(e);

		logFirstLevelIds("Update After Del");

		insertEle(e, ele);

		logFirstLevelIds("Update After Insert");
	}

	function insertEle(e, ele) {
		//Find out the element id, parent id, and older sibling id if it exists
		var ele_id = e.getAttribute('_id');
		var par_id = e.parentNode.getAttribute('_id');
		var os_id = null;

		var olderSib = $(e).prev();
		if (olderSib.length > 0) {
			os_id = olderSib[0].getAttribute('_id');
		}
		
		//Insert the element in the correct position
		//If there is a parent container
		var eles = page.elements;
		var ind = 0;
		if (par_id) {
			eles = getElementArray(par_id);

			//If there is no older sibling
			if (!os_id) {
				eles.splice(0, 0, ele);
			} else {
				ind = getIndex(os_id, eles) + 1;
				eles.splice(ind, 0, ele);
			}
		} else {
			if (!os_id) {
				eles.splice(0, 0, ele);
			} else {
				ind = getIndex(os_id, eles) + 1;
				eles.splice(ind, 0, ele);
			}
		}

		//Update the eleMap
		var elementMap = page.eleMap;
		if (par_id) {
			par_id = parseInt(par_id);
		}
		
		elementMap[ele._id] = par_id;
	}


	function removeAll() {
		startTransaction();

		$('[grabbed]').each(function() {
			if (this.className.indexOf('gu-mirror') == -1) {
				this.remove();
			} else {
				deleteEleMapChildren(this);
			}

			deleteEle(this);
		});

		commitTransaction();
	}

	function startTransaction() {
		page = Pages.findOne({name: pageName});
	}

	function commitTransaction() {
		Pages.update({ _id: page._id }, { $set: {elements: page.elements, eleMap: page.eleMap, lastID: page.lastID }});
		//console.log(JSON.stringify(page.eleMap));
		//console.log(JSON.stringify(page.elements));

		logFirstLevelIds("commitTransaction");
	}

	function logFirstLevelIds(section) {
		if (debug) {
			var pageElements = page.elements;
			var pageEleArr = [];
			for (var i = 0; i < pageElements.length; i++) {
				pageEleArr.push(pageElements[i]['_id']);
			}

			console.log(section + ": " + pageEleArr);
		}
	}

	function moveRelativeToTarget(target, element, beforeBool) {
		var ele;
		var targetBool = false;
		if (target === element) {
			targetBool = true;
		}

		ele = $(element);

		//Still required so that there is a holding position for elements being copied before being deleted
		//As the database will eventually create the object itself but the method needs a position
		if (copyBool && !targetBool) {
			ele = $(element).clone();
			ele.removeAttr('grabbed');
		}

		if (!targetBool) {
			if (beforeBool) {
				ele.insertBefore(target);
			} else {
				ele.insertAfter(target);
			}
		}

		ele = ele[0];

		if (copyBool) {
			var type = ele.getAttribute('type');
			var obj = {
				type: type,
				eid: null,
				_id: page.lastID = ++page.lastID,
				id: null
			};

			if (type == 'container') {
				obj.elements = [];
			} else if (type == 'item') {
				obj.label = null;
				obj.value = null;
			}
			
			if (targetBool) {
				insertEle(target, obj);
				target.remove();
			} else {
				insertEle(ele, obj);
				ele.remove();
			}
		} else {
			updateEle(ele);
		}
	}

	function moveSelected(target) {
		//The target is the destination element

		//Update the target in the database we'll do the rest during the loop through the grabbed items
		startTransaction();

		if (copyBool) {
			$(target).removeAttr('grabbed');
		}

		var before = true;

		var targetInd = selectedPositions.index(target);

		if (copyBool) {
			targetInd = selectedPositions.index(dragEle);
		}

		if (!copyBool) {
			moveRelativeToTarget(target, target);
		}

		for (var i = 0; i < targetInd; i++) {
			moveRelativeToTarget(target, selectedPositions[i], before);			
		}

		for (var i = selectedPositions.length - 1; i > targetInd; i--) {
			moveRelativeToTarget(target, selectedPositions[i], !before);		
		}

		if (copyBool) {
			moveRelativeToTarget(target, target);
		}

		// $('[grabbed]').each(function() {
		// 	targetBool = false;
		// 	if (copyBool) {
		// 		if (this === dragEle) {
		// 			before = false;
		// 			targetBool = true;
		// 		}
		// 	} else {
		// 		if (this === target) {
		// 			targetBool = true;
		// 		}

		// 		before = true;
		// 		if (selectedPositions.index(this) > targetInd) {
		// 			before = false;
		// 		}
		// 	}

		// 	if (!targetBool) {
		// 		if (copyBool) {
		// 			ele = $(this).clone();
		// 			ele.removeAttr('grabbed');
		// 		} else {
		// 			ele = $(this);
		// 		}

		// 		if (before) {
		// 			ele.insertBefore(target);
		// 		} else {
		// 			ele.insertAfter(target);
		// 		}
		// 	}

		// 	if (copyBool) {
		// 		//TODO
		// 		var type = this.getAttribute('type');
		// 		var obj = {
		// 			type: type,
		// 			eid: null,
		// 			_id: page.lastID = ++page.lastID,
		// 			id: null
		// 		};

		// 		if (type == 'container') {
		// 			obj.elements = [];
		// 		} else if (type == 'item') {
		// 			obj.label = null;
		// 			obj.value = null;
		// 		}
		// 		if (targetBool) {
		// 			insertEle(target, obj);
		// 			target.remove();
		// 		} else {
		// 			insertEle(ele, obj);
		// 			ele.remove();
		// 		}
		// 	} else {
		// 		updateEle(this);
		// 	}
		// });

		//Update the database with the data changes.
		commitTransaction();

		dragEle = null;
		selectedPositions = $([]);
	}

	Template.dragList.onRendered(function() {
		var selectStack = [];
		var dragEle;
		var copyBool;
		var removeEle;


		$(window).on('mousedown', function(e) {select(e);});

		drake = dragulaConfig();
		drake.on('dragend', function(el) {recursiveSetup(el)});
		drake.on('remove', function() {removeAll();});

		function select(e) {
			//TODO prevent shift modifier on cross container
			var target = e.target;

			noSelProps = {
				"text": null,
				"select-one": null
			};

			if (noSelProps.hasOwnProperty(target.type)) {
				return;
			}

			var closestEle = $(target).closest('.element');
			if (closestEle.length) {
				target = closestEle[0];
			}

			var className = target.className;
			if (className.indexOf('panelGrab') > -1 || className.indexOf('element') > -1) {
				if (e.shiftKey) {
					if (selectStack.length > 0) {
						var lastTarget = selectStack[selectStack.length - 1];
						if (target === lastTarget) {
							return;
						}
						
						var container = $('.panel');
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
	});


}

if (Meteor.isServer) {
	Meteor.startup(() => {
		//Items.remove({});
		if (Items.find({}).count() === 0) {
			Items.insert({type:'item', name: 'Item'});
			Items.insert({type:'container', name: 'Container'});

			// Items.insert({name:'Text Box', bgcolor: 'black', color:'red', id:1});
			// Items.insert({name:'Drop Down List', bgcolor: 'black', color:'blue', id:2});
			// Items.insert({name:'Radio Button', bgcolor: 'black', color:'green', id:3});
			// Items.insert({name:'Check Box', color:'orange', id:4});
			// Items.insert({name:'Calendar', bgcolor: 'black', color:'yellow', id:5});
			// Items.insert({name:'Output Text', color:'purple', id:6});
			// Items.insert({name:'Hyper Link', bgcolor: 'black', color:'brown', id:7});
			// Items.insert({name:'Suggestion Box', color:'pink', id:8});
			// Items.insert({name:'A4J Button', color:'cyan', id:9});
			// Items.insert({name:'Command Button', color:'gray', id:10});
			// Items.insert({name:'File Upload', id:11});
			// Items.insert({name:'Padding', id:12});

			//_(20).times(function(n) {
			//	Items.insert({name:'Item'+n,number:n});
			//});
		}

		//Fields that elements should have access to
		//Defaults
		//tabInd: true
		//maxLen: false
		//disable: true
		//event: null
		//validators: null
		//nullMsg: true
		//orientation: false
		//option: null
		//a4j: false //choice to turn off ajax for event
		//default: true //all the default options
		//value: true
		//list: false //drop down list select items
		Elements.remove({});
		if (Elements.find({}).count() === 0) {
			Elements.insert({
				type: 'item',
				elementId: 't',
				elementName: 'Text Box',
				maxLen: true,
				events: [1,2,6,7,8],
				validators: [],
				converters: []
			});
			Elements.insert({
				type: 'item',
				elementId: 'd',
				elementName: 'Drop Down',
				list: true,
				events: [2]
			});
			Elements.insert({
				type: 'item',
				elementId: 'a',
				elementName: 'Hyper Link',
				events: [3]
			});
			Elements.insert({
				type: 'item',
				elementId: 'o',
				elementName: 'Output Text',
				tabInd: false,
				disable: false,
				converters: []
			});
			Elements.insert({
				type: 'item',
				elementId: 'r',
				elementName: 'Radio Button',
				orientation: true
			});
			Elements.insert({
				type: 'item',
				elementId: 'c',
				elementName: 'Calendar',
				option: ['adult', 'max']
			});
			Elements.insert({
				type: 'item',
				elementId: 'b',
				elementName: 'Check Box',
				events: [3]
			});
			Elements.insert({
				type: 'item',
				elementId: 's',
				elementName: 'Button',
				events: [3],
				a4j: true
			});
			Elements.insert({
				type: 'item',
				elementId: 'u',
				elementName: 'File Upload'
			});
			Elements.insert({
				type: 'item',
				elementId: 'pad',
				elementName: 'Padding',
				tabInd: false,
				disable: false,
				default: false
			});
			Elements.insert({
				type: 'item',
				elementId: 'x',
				elementName: 'Blank Cell',
				tabInd: false,
				disable: false,
				value: false
			});
			Elements.insert({
				type: 'container',
				elementId: 't0',
				elementName: 'Content Box',
				tabInd: false,
				disable: false,
				value: false
			});
			Elements.insert({
				type: 'container',
				elementId: 't1',
				elementName: 'Table',
				tabInd: false,
				disable: false,
				value: false
			});
			Elements.insert({
				type: 'container',
				elementId: 'tm',
				elementName: 'Table Full',
				tabInd: false,
				disable: false,
				value: false
			});
			Elements.insert({
				type: 'container',
				elementId: 'y',
				elementName: 'Panel Group',
				tabInd: false,
				disable: false,
				value: false
			});
			Elements.insert({
				type: 'container',
				elementId: 'f1',
				elementName: 'Field Set',
				tabInd: false,
				disable: false,
				value: false
			});
		}

		//Events.remove({});
		if (Events.find({}).count() === 0) {
			Events.insert({id: 1, name: 'onblur'});
			Events.insert({id: 2, name: 'onchange'});
			Events.insert({id: 3, name: 'onclick'});
			Events.insert({id: 4, name: 'ondblclick'});
			Events.insert({id: 5, name: 'onfocus'});
			Events.insert({id: 6, name: 'onkeypress'});
			Events.insert({id: 7, name: 'onkeyup'});
			Events.insert({id: 8, name: 'onkeydown'});
			Events.insert({id: 9, name: 'onmousedown'});
			Events.insert({id: 10, name: 'onmousemove'});
			Events.insert({id: 11, name: 'onmouseout'});
			Events.insert({id: 12, name: 'onmouseover'});
			Events.insert({id: 13, name: 'onmouseup'});
			Events.insert({id: 14, name: 'onselect'});
		}

		//Validators.remove({});
		if (Validators.find({}).count() === 0) {
			Validators.insert({id: '$', name: 'currency'});
			Validators.insert({id: 'e', name: 'email'});
			Validators.insert({id: 'p', name: 'password', object: 'securePassword'});
			Validators.insert({id: 'h', name: 'phone', object: 'intPhoneNumber'});
			Validators.insert({id: 's', name: 'ssn'});
			Validators.insert({id: '%', name: 'percentage'});
			Validators.insert({id: 'z', name: 'postalcode'});
			Validators.insert({id: 't', name: 'einTax'});
			Validators.insert({id: 'c', name: 'calendar', object: 'datetimepicker'});
		}

		Pages.remove({});
		if (Pages.find({}).count() === 0) {
			Pages.insert({
				name: 'Quick Contractor Questionnaire',
				menu: true,
				template: false,
				pagetitle: 'easyCntrctQues',
				dto: 'easyContractQuesDTO',
				backing: 'easyContractQuesBacking',
				lastID: 6,
				eleMap: {
					1: null,
					2: 1,
					3: 1,
					5: null,
					6: 5,
					4: 6
				},
				elements: [
					{
						type: 'container',
						elementId: 't0',
						elementName: 'Content Box',
						_id: 1,
						id: 'easyCntrctQues',
						label: 'easyCntrctQues',
						elements: [
							{
								type: 'item',
								elementId: 't',
								elementName: 'Text Box',
								_id: 2,
								id: 'bndAmt',
								label: 'bndAmt',
								value: 'bond.bondMoney',
								validator: '$',
								converter: 1,
								maxLen: 15,
								events: {
									1: 'validateAmount'
								}
							},
							{
								type: 'item',
								elementId: 'd',
								elementName: 'Drop Down',
								_id: 3,
								id: 'bndType',
								label: 'bndType',
								value: 'bond.bondTypeId',
								list: 'bondTypeSelectList',
								events: {
									2: 'changeStuff'
								}
							}
						]
					},
					{
						type: 'container',
						elementId: 'y',
						elementName: 'Panel Group',
						_id: 5,
						id: 'banana',
						label: 'banana',
						elements: [
							{
								type: 'container',
								elementId: 'f1',
								elementName: 'Field Set',
								_id: 6,
								id: 'potato',
								label: 'banana',
								elements: [
									{
										type: 'item',
										elementId: 'd',
										elementName: 'Drop Down',
										_id: 4,
										id: 'bndFrm',
										label: 'bndFrm',
										value: 'bond.bondFormId',
										list: 'bondFormSelectList',
										validator: 1,
										converter: 1
									}
								]
							}
						]
					}
				],
				revisions: [
					{
						id: 1,
						date: '12345',
						user: 'Chris Williams',
						comment: 'Initial Commit of the page.',
						data: {
							name: 'Quick Contractor Questionnaire',
							menu: true,
							template: false,
							pagetitle: 'easyCntrctQues',
							dto: 'easyContractQuesDTO',
							backing: 'easyContractQuesBacking',
							elements: [
								{
									type: 'container',
									eid: 't0',
									_id: 1,
									id: 'easyCntrctQues',
									label: 'easyCntrctQues',
									elements: [
										{
											type: 'item',
											eid: 't',
											_id: 2,
											id: 'bndAmt',
											label: 'bndAmt',
											value: 'bond.bondMoney',
											validator: '$',
											converter: 1,
											maxLen: 15,
											events: {
												1: 'validateAmount'
											}
										},
										{
											type: 'item',
											eid: 'd',
											_id: 3,
											id: 'bndType',
											label: 'bndType',
											value: 'bond.bondTypeId',
											list: 'bondTypeSelectList',
											events: {
												2: 'changeStuff'
											}
										},
										{
											type: 'item',
											eid: 'd',
											_id: 4,
											id: 'bndFrm',
											label: 'bndFrm',
											value: 'bond.bondFormId',
											list: 'bondFormSelectList',
											validator: 1,
											converter: 1
										}
									]
								}
							]
						}
					}
				]
			});
		}
	});
}
