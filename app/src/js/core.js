var $nx = (function () {
    'use strict';
    var resources = {
        'filters' : { },
        'constants' : { },
        'factory' : { },
        '$_nx' : { },
        'mode' : null,
        'node':{},
        'nodeTypeMd':{},
        'nodeClass':{},
        'root' : '/',
        'routes' : [],
        'controller' : { },
        'controller_dependancy':{},
        'config': function(options) {
            resources.mode = options && options.mode && options.mode == 'history' 
                        && !!(history.pushState) ? 'history' : 'hash';
            resources.root = options && options.root ? '/' + resources.clearSlashes(options.root) + '/' : '/';
        },
        'getFragment': function() {
            var fragment = '';
            if(resources.mode === 'history') {
                fragment = resources.clearSlashes(decodeURI(location.pathname + location.search));
                fragment = fragment.replace(/\?(.*)$/, '');
                fragment = resources.root != '/' ? fragment.replace(resources.root, '') : fragment;
            } else {
                var match = window.location.href.match(/#(.*)$/);
                fragment = match ? match[1] : '';
            }
            return resources.clearSlashes(fragment);
        },
        'clearSlashes': function(path) {
            return path.toString().replace(/\/$/, '').replace(/^\//, '');
        },
        'check': function (hash) {
            var reg, keys, match, routeParams;
            for (var i = 0, max = resources.routes.length; i < max; i++ ) {
                routeParams = {}
                keys = resources.clearSlashes(resources.routes[i].path).match(/:([^\/]+)/g);
                match = hash.match(new RegExp(resources.clearSlashes(resources.routes[i].path).replace(/:([^\/]+)/g, "([^\/]*)")));
                console.log(resources.routes[i].path);
                if (match) {
                    match.shift();
                    match.forEach(function (value, i) {
                        routeParams[keys[i].replace(":", "")] = value;
                    });
                    var LDependancy = api.loadDependancies(resources.controller_dependancy[resources.routes[i].handler]);
                        LDependancy.push(routeParams);
                        resources.controller[resources.routes[i].handler].apply(this, LDependancy);
                        break;
                }
                else{
                    if(resources.clearSlashes(resources.routes[i].path) == hash){
                        //load dependency and call
                        var LDependancy = api.loadDependancies(resources.controller_dependancy[resources.routes[i].handler]);
                        resources.controller[resources.routes[i].handler].apply(this, LDependancy);
                        break;
                    }
                }
            }
        },
        
        'listen': function() {
            var current = "/";
            var fn = function() {
                // console.log("..");
                if(current !== resources.getFragment()) {
                    current = resources.getFragment();
                    resources.check(current);
                }
            }
            if(resources.mode == 'hash'){
                clearInterval(this.interval);
                this.interval = setInterval(fn, 50);
            }
            if(resources.mode == 'history'){
                this.interval = setTimeout(fn, 50);    
            }
        },
    }, 
    api = {
        'filters': function (key, val) {
            resources.filters[key] = val;
        },
        'factory': function (key, arrayArg) {
            var last_index = arrayArg.length-1;
            var dependancies = arrayArg.slice(0, -1);
            if (typeof arrayArg[last_index] === "function") {
                console.log("-"+api.loadDependancies(dependancies));
                resources.factory[key] = arrayArg[last_index].apply(this, api.loadDependancies(dependancies)); // arrayArg[last_index];
            } else {
                console.log("Nan");
            }
        },
        'routes' :  function(route, controller){
            var temp = {'path':route, 'handler':controller };
            resources.routes.push(temp);
        },
        'controller' : function(controller, handler){
            var last_index = handler.length-1;
            var dependancies = handler.slice(0, -1);
            if (typeof handler[last_index] === "function") {
                resources.controller[controller] = handler[last_index];
                resources.controller_dependancy[controller] =  dependancies;
            } else {
                console.log("Nan");
            }
        },
        'loadDependancies' : function(arrayArg){
            var dependancy = [], iter;
            for (iter = 0; iter < arrayArg.length; iter += 1) {
                if (typeof arrayArg[iter] === "string") {
                    //look in modules
                    if (resources.hasOwnProperty(arrayArg[iter])){
                        dependancy.push(api.loadModule(arrayArg[iter]));
                    } else {
                    //look in factory
                    if (resources.factory.hasOwnProperty(arrayArg[iter])) {
                        dependancy.push(api.loadDependancy(arrayArg[iter]));
                    } else {
                            //look in constants
                            if (resources.constants.hasOwnProperty(arrayArg[iter])) {
                                dependancy.push(api.loadConstant(arrayArg[iter]));
                            } else {
                                //if it is $_nx scope
                                if (arrayArg[iter] === "$_nx") {
                                    dependancy.push({});
                                } else {
                                    console.log("Error: " + arrayArg[iter] + " is not Found in constants and Factories");
                                }
                            }
                        }
                    }
                } 
            }
            return dependancy;
        },
        
        'loadModule': function (key) {
            return resources[key];
        },

        'loadDependancy': function (key) {
            return resources.factory[key];
        },

        'loadConstant': function (key) {
            return resources.constants[key];
        },

        'constants': function (key, val) {
            resources.constants[key] = val(); 
        },

        'module': function(key, arrayArg){
                var last_index = arrayArg.length-1;
                var dependancies = arrayArg.slice(0, -1);
                if (typeof arrayArg[last_index] === "function") {
                    console.log("-"+api.loadDependancies(dependancies));
                    resources[key] = arrayArg[last_index].apply(this, api.loadDependancies(dependancies)); // arrayArg[last_index];
                } else {
                    console.log("Nan");
                }
        },
        'nodeMgr':function(key,nd_type,arrayArg){
             var fn_index = arrayArg.length-1;
              var dependancies = arrayArg.slice(0, -1);
               if (typeof arrayArg[fn_index] === "function") {
                var _ndMgrObj=new _ndMgrClass(resources.nodeTypeMd[nd_type])
                arrayArg[fn_index].apply(_ndMgrObj,api.loadDependancies(dependancies));
                
                //add this _nMgrObj obj to the _mapper so that it can be intiated when map come to load this node
                _ndMgrObj.id=key;
                resources.node[key]=_ndMgrObj;
               }
        },
         'node':function(key,arrayArg){
            if(key.startsWith('$')){
             }
            else{
                console.log("custom node "+key+": should being registered");
            }
              var fn_index = arrayArg.length-1;
              var dependancies = arrayArg.slice(0, -1);
               if (typeof arrayArg[fn_index] === "function") {
               
                    var _nodeTypeObj=new _ndTypeClass();
                    arrayArg[fn_index].apply(_nodeTypeObj, api.loadDependancies(dependancies));
                    _nodeTypeObj.id=key;
                    resources.nodeTypeMd[key]=_nodeTypeObj;
                }            
        },
        'start':function(){
            //1)read maper json
           
           var map= this.readMap();
            this.buildForMap(map);  
           
        },
        'readMap':function(){
             var map=resources._mapperJson || (resources._mapperJson=mapperJson);
             return map;
        },
        'buildForMap':function(_map){
              if(_map.id!=undefined){
                    var ndMgr=resources.node[_map.id];
                     //2)build the node
                //make an ajax call to intiate the node to build
                    var ndTyp_conf=ndMgr.geter('config');       
                    this.buildNodeTemplate.apply(ndTyp_conf,[ndMgr]);
            }
        },
        'getParentMapNode':function(id,json,parent){
            if(id!=undefined && typeof id=='string'){
                if(json.id==id){return parent || json;}
                else{
                    for (var i = json.child.length - 1; i >= 0; i--) {
                        return api.getParentMapNode(id,json.child[i],json);
                    }
                }
            }
        },
        'getMapNode':function(id,json){
            if(id!=undefined && typeof id=='string'){
                if(json.id==id){return json}
                else{
                    for (var i = json.child.length - 1; i >= 0; i--) {
                        return api.getMapNode(id,json.child[i]);
                    }
                }
            }
        },
        'getNextNodeToRender':function(node){
            if(node.id!=undefined && typeof node.id=='string'){
              /*  if(json.id==id){return json}
                else{
                    for (var i = json.child.length - 1; i >= 0; i--) {
                        return api.getMapNode(id,json.child[i]);
                    }
                }*/
                //check to return if any siblings unrendered
                var parentNode=this.getParentMapNode(node.id,resources._mapperJson)
                for (var i = 0; i < parentNode.child.length; i++) {
                    var nd=parentNode.child[i]
                    if(nd.rendered!=true || nd.rendered==undefined){
                        return nd;
                    }
                }
                //when all siblings are rendered go for child
                if(node.child!=undefined && node.child.length>0){
                    return node.child[0];
                }else{
                    console.log('all nodes rendered i gues :)');
                }
            }
        },
        'buildNodeTemplate':function(implObj,parentNode,promiseCallback){
            /*this gets 2 params (node type and implementation obj)
                the node type defines the type of node to be taken from resource nodetype md and
                the impl obj can be two things
                =>if this is the parent node type this would be the implementation obj (ndmgr)
                =>if build is called in for sub nodes that are imported this will be the parent obj to which the raise event should
                deligate the listeners added to it

            */     
            var _node=this;
            _node.implObjId=implObj.id;
            var _implObj=implObj;
            var _parentNode=parentNode;
            var _promiseCallback=promiseCallback;
            _node.raiseMgrEvent=function(key,data){
                        //check for 
                        if(this.childNode!=undefined){
                        console.log('need to deligate event to parent');
                       // var deligateEvent=resources.nodeTypeMd[this.parentNodeType].geter(key+'/'+this.childNode);
                          var deligateEvent=this.parentNode.geter(key+'/'+this.childNode);
                           if(deligateEvent!=undefined){
                            if(data!=undefined){
                                deligateEvent.dependancies.unshift(data);
                                }
                                deligateEvent._fn.apply(_parentNode,deligateEvent.dependancies);
                            }
                        }else{
                           var event=resources.node[this.implObjId].geter(key);
                           //var event=this.geter(key);
                            if(event!=undefined){
                                if(data!=undefined){
                                event.dependancies.unshift(data);
                                }
                            event._fn.apply(this,event.dependancies);
                            }
                        }
                        
                    }
              /*_node.super=function(){
                if(this.imports!=undefined){
                 var importsListeners=Object.keys(this.imports);
                                     for (var i = importsListeners.length - 1; i >= 0; i--) {
                                         var importNode=this.imports[importsListeners[i]];
                                         importNode.elem=this.elem.find('[node='+importsListeners[i]+']');
                                         
                                          var listenersArray=importNode.getListeners();
                                          var postLoadTmpl_obj=importNode.geter('_postLoadTmpl');
                                          if(postLoadTmpl_obj){
                                               postLoadTmpl_obj._fn.apply(importNode,postLoadTmpl_obj.dependancies);
                                          }
                                     };
                
            }*/
             _node.publishEvent=function(key,data){
                console.log(this);
               var eventObj=this.geter('__'+key);
                if(eventObj){
                    if(data!=undefined)
                    eventObj.dependancies.push(data);
                    radio('__'+key+'/'+this.childNode+'/'+this.implObjId).broadcast(eventObj.dependancies);
               //     eventObj._fn.apply(this,eventObj.dependancies);
                }
            }
            var _obj;
            var ent_obj=_node.geter('_entry');
            if(this.childNode==undefined){
                var _glEnt_obj=_implObj.geter('_$entry');
                if(_glEnt_obj!=undefined){
                    _obj=_glEnt_obj._fn.apply(_node,_glEnt_obj.dependancies);
                    }
                    ent_obj.dependancies.unshift(_obj);
            }
            if(ent_obj!=undefined)
            {
                ent_obj._fn.apply(_node,ent_obj.dependancies);
            }

            var extraParamAjax_obj=_node.geter('_extraParamAjax');
                    var promise=new Promise(function(resolve, reject) {
                        if(extraParamAjax_obj!=undefined){
                        var scope={'config':_node,'return':resolve,'error':reject};
                        extraParamAjax_obj._fn.apply(scope,[api.loadModule('nxAjax')]);
                        }else{resolve('');}
            }).then(function(extraParams){
              _node.extraParams=extraParams;
                        var promise=new Promise(function(resolve, reject) {
                        if(_node.dom==undefined){
                            var scope={'config':_node,'return':resolve,'error':reject};
                            api.loadModule('nxAjax').getTemplate(_node.template,scope,function(data){
                                this.config.dom=data;
                                scope.return();
                            });
                            }else{
                               resolve();
                            }
                           
                        }).then(function(){
                            _node.dom=$(_node.dom);
                            var promise=new Promise(function(resolve, reject) {
                            if(_node.class!=undefined)
                            for (var i = _node.class.length - 1; i >= 0; i--) {
                                $(_node.dom).addClass(_node.class[i]);
                            }
                            var scope={'config':_node,'return':resolve,'error':reject};
                             var preLoadTmpl_obj=_node.geter('_preLoadTmpl');
                             if(preLoadTmpl_obj!=undefined){
                             preLoadTmpl_obj._fn.apply(scope,preLoadTmpl_obj.dependancies);
                            }else{resolve();}
                        })
                        .then(function(){
                            var build_obj=_node.geter('_$build');
                            if(build_obj!=undefined){
                            var importNodes=build_obj._fn.apply(_node,build_obj.dependancies);
                            }
                            if(importNodes!=undefined){
                            _node.imports={};
                            _node.importReady=[];
                            for (var keys=Object.keys(importNodes),i = keys.length - 1; i >= 0; i--) {
                                var child=importNodes[keys[i]];
                                 var nd=$.extend({},resources.nodeTypeMd[child]);
                                 //make a clone of nd type
                                 var childNodeType=_node.imports[keys[i]]=nd;
                                 childNodeType.childNode=keys[i];
                                 childNodeType.parentNodeId=_node.id;
                                 childNodeType.parentNode=_node;
                                 //api.buildNodeTemplate.apply(childNodeType,[implObj,_node]);
                                 console.log('built'+_node);
                                 var promise=new Promise(function(resolve, reject) {
                                    api.buildNodeTemplate.apply(childNodeType,[implObj,_node,resolve]);
                                 })
                                 .then(function(_childNode){
                                _node.dom=$(_node.dom);
                                var tempDom=_childNode.dom.clone();
                                var childDomPointer=_node.dom.find('[node='+_childNode.childNode+']');
                                 var childInnerDom=childDomPointer[0].innerHTML;
                                 if(childDomPointer!=undefined){
                                    $(childDomPointer).empty();
                                    $(childDomPointer).append(tempDom);
                                 }
                                if(tempDom.innerWraper!=undefined){
                                    tempDom.innerWraper.append(childInnerDom);
                                 }
                                 console.log(_node.dom);
                                 _node.importReady.push(tempDom.childNode);

                                if(_node.importReady.length==keys.length){
                                      console.log('all child nodes built');
                                       var _preLoadChildTmpl_obj=_node.geter('_preLoadChildTmpl');
                                        if(_preLoadChildTmpl_obj!=undefined){
                                        _preLoadChildTmpl_obj._fn.apply(_node,_preLoadChildTmpl_obj.dependancies);
                                        api.compileTemplate.apply({},[_implObj]);
                                        }
                                    }
                                 });
                                
                            }
                                

                           }else{
                            console.log('no more childs to build for:'+_node);
                            if(_promiseCallback!=undefined)
                            _promiseCallback(_node);
                            else if(_parentNode==undefined){
                                console.log('singular node without imports');
                               api.compileTemplate.apply({},[_implObj]);
                            }else{
                                console.log('somethimg is wrong here');
                            }
                           }

                           //template is ready 
                            //there is no more child so template is ready make call for inspector providing the template and
                            //the md that goes to it before compiling the temp
                            //console.log('begin md process');
                        });
                     })

            });
        },
        'compileTemplate':function(nodeMgr){

            this._nodeMgr=nodeMgr;
            this._node=this._nodeMgr.geter('config');
            this.mdSrc=this._nodeMgr.mdSrc;
            if(this.mdSrc!=undefined){
                //read data source id from maper

           }
            api.loadModule('nxAjax').getNodeData(this.mdSrc,this,function(data){
                var that=this;
                if(this._node.nodeMd==undefined)
                this._node.nodeMd=data;
                var promise=new Promise(function(resolve, reject) {
                            if(that._node.dom!=undefined && that._node.dom.length!=0){
                            var scope={'config':that._node,'return':resolve,'error':reject};
                             var nodeDataReady_obj=that._node.geter('_nodeDataReady');
                             if(nodeDataReady_obj){
                             nodeDataReady_obj._fn.apply(scope,nodeDataReady_obj.dependancies);
                            }else{resolve(that);}
                            }else{resolve(that);}
                        }).then(function(){
                            console.log(that);
                             if(that._node.dom!=undefined && that._node.dom.length!=0){
                            var template = Handlebars.compile(that._node.dom[0].outerHTML);
                            that._node.elem=$(template(that._node.nodeMd));
                        
                       

                            if(that._node.imports!=undefined){
                                     var importNodes=Object.keys(that._node.imports);
                                     for (var i = importNodes.length - 1; i >= 0; i--) {
                                         var importNode=that._node.imports[importNodes[i]];
                                         var childListenersArray=importNode.getListeners();
                                    
                                         for (var j = 0; j < childListenersArray.length; j++) {
                                           if(childListenersArray[j].startsWith('__')){
                                            var childListener_obj=importNode.geter(childListenersArray[j]);
                                            radio(childListenersArray[j]+'/'+importNode.childNode+'/'+that._node.implObjId).subscribe([childListener_obj._fn,importNode]);
                                             }
                                         };

                                         importNode.elem=that._node.elem.find('[node='+importNodes[i]+']');
                                        var childPostLoadTmpl_obj=importNode.geter('_postLoadTmpl');
                                            if(childPostLoadTmpl_obj){
                                                 childPostLoadTmpl_obj._fn.apply(importNode,childPostLoadTmpl_obj.dependancies);
                                            }

                                        }
                                     };
                                
                                 //create radio subscribe for all the node events
                                 //binding the listeners of parent to the dom after postload
                                    var listenersArray=that._node.getListeners();
                                    for(var i=0,length=listenersArray.length;i<length;i++){
                                    if(listenersArray[i].startsWith('__') && listenersArray[i].indexOf('/')==-1){
                                    var listener_obj=that._node.geter(listenersArray[i]);
                                    radio(listenersArray[i]+'/'+that._node.implObjId).subscribe([listener_obj._fn, that.node]);
                                       //     listener_obj._fn.apply(that._node,listener_obj.dependancies);
                                        }
                                    }
                               var postLoadTmpl_obj=that._node.geter('_postLoadTmpl');
                                 if(postLoadTmpl_obj){
                                    postLoadTmpl_obj._fn.apply(that._node,postLoadTmpl_obj.dependancies);
                                     }
                                     /*if(that._node.imports!=undefined){
                                     var importsListeners=Object.keys(that._node.imports);
                                     for (var i = importsListeners.length - 1; i >= 0; i--) {
                                         var importNode=that._node.imports[importsListeners[i]];
                                         importNode.elem=that._node.elem.find('[node='+importsListeners[i]+']');
                                         
                                          var listenersArray=importNode.getListeners();
                                            for(var j=0,length=listenersArray.length;j<length;j++){
                                                if(listenersArray[j].startsWith('__')){
                                                    var listener_obj=importNode.geter(listenersArray[j]);
                                                    listener_obj._fn.apply(importNode,listener_obj.dependancies);
                                                }
                                            }
                                     };
                                 }
                                    //add listeners now
                                   
                                    //binding child listeners if any
                                     for(var i=0,length=listenersArray.length;i<length;i++){
                                        if(listenersArray[i].indexOf('/') > -1){
                                            var listener_obj=that._node.geter(listenersArray[i]);
                                            listener_obj._fn.apply(that._node,listener_obj.dependancies);
                                        }
                                    }*/
                                    //************   need to write exit and global exit *******
                                   api.nodeRenderer(that._nodeMgr.id);
                             }else{
                                 console.log('dom itself not there');
                             }
                        })
            });
        },
        'nodeRenderer':function(nodeMgrId){
                /*rad maper json and find ekement
                check fot all childs templates to be ready, if not log erroe
                get the parent nodemgr id, if not put it to main body
                get the parent node elem inner innerWraper and append this
                if child present for this nodeMgr intiate them through promise*/
                    var ndMap=api.getMapNode(nodeMgrId,resources._mapperJson);
                    var ndMgrObj=resources.node[ndMap.id];
                    var ndData=ndMgrObj.geter('config');

                    var parentNdMap=api.getParentMapNode(nodeMgrId,resources._mapperJson);
                    if(parentNdMap==undefined || ndData.innerWraper==undefined || $(ndData.innerWraper).length==0){
                        $('#main').append(ndData.elem);
                    }else{
                    var parentNdMgrObj=resources.node[parentNdMap.id];
                    var parentNdData=parentNdMgrObj.geter('config');
                     if(parentNdData!=undefined && parentNdData.innerWraper!=undefined && $(parentNdData.innerWraper).length>=0){
                        $(parentNdData.innerWraper).append(ndData.elem);
                     }else{console.log('error here plz check');}
                    }
                    ndMap.rendered=true;
                    var nxtnodeMap=this.getNextNodeToRender(ndMap);
                    if(nxtnodeMap!=undefined){
                   /* var nxtnodeMgrObj=resources.node[nxtnode.id];
                    var nxtnodeData=parentNdMgrObj.geter('config');
                    this.buildNodeTemplate.apply(nxtnodeData,[nxtnodeMgrObj]);
                   */
                   this.buildForMap(nxtnodeMap)
                    }

        },
        'buildDummy':function(ndMgr){

                var _TypScope,ndTyp_conf=_TypScope=ndMgr.geter('config');
                    ndTyp_conf.raiseMgrEvent=function(key,data){
                        var event=ndMgr.geter(key);
                        if(event!=undefined){
                            if(data!=undefined){
                            event.dependancies.unshift(data);
                            }
                        event._fn.apply(ndMgr,event.dependancies);
                        }
                    }

                    //TO_DO: PARENT NODE childEventListeners NEED TO BE FIRED ACORDINGLY
                    //call the mgr global entyr if defined then pass its return value to the node entry then fire the mgr entry
                    
                    var _glEnt_obj=ndMgr.geter('_$entry');
                    var ent_obj=ndTyp_conf.geter('_entry');
                    if(_glEnt_obj!=undefined){
                    var _obj=_glEnt_obj._fn.apply(ndTyp_conf,_glEnt_obj.dependancies);
                    ent_obj.dependancies.unshift(_obj);
                    }
                    ent_obj._fn.apply(ndTyp_conf,ent_obj.dependancies);

                    var extraParamAjax_obj=ndTyp_conf.geter('_extraParamAjax');
                    var promise=new Promise(function(resolve, reject) {
                        if(extraParamAjax_obj!=undefined){
                        var scope={'config':_TypScope,'return':resolve,'error':reject};
                        extraParamAjax_obj._fn.apply(scope,extraParamAjax_obj.dependancies);
                        }else{resolve('');}
                    })
                    .then(function(extraParams){
                        _TypScope.extraParams=extraParams;

                        var promise=new Promise(function(resolve, reject) {
                            if(_TypScope.dom==undefined && _TypScope.dom.length==0){
                            var scope={'config':_TypScope,'return':resolve,'error':reject};
                             var preLoadTmpl_obj=_TypScope.geter('_preLoadTmpl');
                             preLoadTmpl_obj._fn.apply(scope,preLoadTmpl_obj.dependancies);
                            }else{resolve(_TypScope.dom);}
                        })
                        .then(function(template){
                            _TypScope.dom=template;
                            console.log('need to call implementation manager preLoadTmpl through raiseMgrEvent');
                            console.log('begin the build imports');
                            var build_obj=_TypScope.geter('_$build');
                            var importNodes=build_obj._fn.apply(_TypScope,build_obj.dependancies);
                            for (var keys=Object.keys(importNodes),i = keys.length - 1; i >= 0; i--) {
                                var child=importNodes[keys[i]];
                                 var nd=resources.nodeTypeMd[child];
                            };
                           
                        });

                    });
                    //ndTyp_conf.extraParams=extraParamAjax_obj._fn.apply(api.loadModule('nxAjax'),extraParamAjax_obj.dependancies);

                    //var preLoadTmpl_obj=ndTyp_conf.geter('_preLoadTmpl');
                    //preLoadTmpl_obj._fn.apply(ndTyp_conf,preLoadTmpl_obj.dependancies);

                    var postLoadTmpl_obj=ndTyp_conf.geter('_postLoadTmpl');
                    postLoadTmpl_obj._fn.apply(ndTyp_conf,postLoadTmpl_obj.dependancies);

                    //binding the listeners to the dom after postload
                    var listenersArray=ndTyp_conf.getListeners();
                    for(var i=0,length=listenersArray.length;i<length;i++){
                        if(listenersArray[i].startsWith('__')){
                            var listener_obj=ndTyp_conf.geter(listenersArray[i]);
                            listener_obj._fn.apply(ndTyp_conf,listener_obj.dependancies);
                        }
                    }

                    var _glExt_obj=ndMgr.geter('_$exit');
                    var exit_obj=ndTyp_conf.geter('_exit');
                    if(_glExt_obj!=undefined){
                    var _obj=_glExt_obj._fn.apply(ndTyp_conf,_glExt_obj.dependancies);
                    exit_obj.dependancies.unshift(_obj);
                    }
                    exit_obj._fn.apply(ndTyp_conf,exit_obj.dependancies);


        }
    };
     var _CellClass=(function(){
                    });
                     _CellClass.prototype._fn_parser=function(arrayArg,_fn){
                        if(typeof arrayArg=='function'  || typeof arrayArg=='Object'){
                                        arrayArg=[arrayArg];
                                    }
                                     var fn_index = arrayArg.length-1;
                                     var dependancies = arrayArg.slice(0, -1);
                                      if (typeof arrayArg[fn_index] === "function") {
                                        dependancies=api.loadDependancies(dependancies);
                                        this.seter().apply(this,[_fn,
                                            {
                                            'dependancies':dependancies,
                                            '_fn':arrayArg[fn_index]
                                            }]);
                                      }
                     };
                     _CellClass.prototype.entry=function(arrayArg){
                       this._fn_parser(arrayArg,'_entry');
                    };
                    _CellClass.prototype.preLoadTmpl=function(arrayArg){
                       this._fn_parser(arrayArg,'_preLoadTmpl'); 
                   };
                   _CellClass.prototype.preLoadChildTmpl=function(arrayArg){
                       this._fn_parser(arrayArg,'_preLoadChildTmpl'); 
                   };
                    _CellClass.prototype.nodeDataReady=function(arrayArg){
                       this._fn_parser(arrayArg,'_nodeDataReady'); 
                   }; 
                   _CellClass.prototype.postLoadTmpl=function(arrayArg){
                       this._fn_parser(arrayArg,'_postLoadTmpl'); 
                   };
                   _CellClass.prototype.exit=function(arrayArg){
                       this._fn_parser(arrayArg,'_exit');
                    };
    var _ndTypeClass= (function(){
                        // recived nodetype specific config here from which take out
                        //the node specific listeners and provide implementation handler functions
                        var fn={};
                       var _cell_api={
                            '_get_fn':function(_fn){
                                 return fn[_fn];
                            },
                            '_set_fn':function(_fn,obj){
                                fn[_fn]=obj;
                            },
                            '_getListeners':function(){
                                return Object.keys(fn);
                            }
                        };
                    
                        this.seter=function(){
                            return _cell_api._set_fn;
                        };
                        this.geter=function(){
                         return _cell_api._get_fn.apply(this,arguments);
                        };
                        this.getListeners=function(){
                            return _cell_api._getListeners.apply(this,arguments);
                        };
                    });
                 /*   _ndTypeClass.prototype._event_parser=function(arrayArg,_fn){
                        if(typeof arrayArg=='function'  || typeof arrayArg=='Object'){
                                        arrayArg=[arrayArg];
                                    }
                                     var fn_index = arrayArg.length-1;
                                     var dependancies = arrayArg.slice(0, -1);
                                      if (typeof arrayArg[fn_index] === "function") {
                                        dependancies=api.loadDependancies(dependancies);
                                        this.seter().apply(this,[_fn,
                                            {
                                            'dependancies':dependancies,
                                            '_fn':arrayArg[fn_index]
                                            }]);
                                   //     radio(_fn).subscribe([arrayArg[fn_index],this]);
                                      }
                     };*/
                    _ndTypeClass.prototype.extraParamAjax=function(_fn_callback){
                     this._fn_parser(_fn_callback,'_extraParamAjax');
                    };
                   _ndTypeClass.prototype.addListeners=function(key,arrayArg){
                      this._fn_parser(arrayArg,'__'+key);
                   };
                   _ndTypeClass.prototype.implChildListeners=function(node,key,arrayArg){
                       this._fn_parser(arrayArg,'__'+key+'/'+node); 
                   };
                   _ndTypeClass.prototype.build=function(arrayArg){
                       this._fn_parser(arrayArg,'_$build'); 
                   };
                    _ndTypeClass.prototype.postFetchChildMd=function(arrayArg){
                       this._fn_parser(arrayArg,'_postFetchChildMd'); 
                   };
                    _ndTypeClass.prototype.extendEntry=function(key,arrayArg){
                       this._fn_parser(arrayArg,'_entry'+'/'+key); 
                    };
                    _ndTypeClass.prototype.extendExit=function(key,arrayArg){
                       this._fn_parser(arrayArg,'_exit'+'/'+key); 
                    };
                    _ndTypeClass.prototype.extendPreloadTmpl=function(key,arrayArg){
                       this._fn_parser(arrayArg,'_preLoadTmpl'+'/'+key); 
                    };
                    _ndTypeClass.prototype.extendPostloadTmpl=function(key,arrayArg){
                       this._fn_parser(arrayArg,'_postLoadTmpl'+'/'+key); 
                    };
     _ndTypeClass=merge(_ndTypeClass,_CellClass);
    var _ndMgrClass= (function(config){
                        // recived nodetype specific config here from which take out
                        //the node specific listeners and provide implementation handler functions
                        var fn={};
                        if(config!=undefined){
                        fn.config=config;
                        }
                        var _cell_api={
                            '_get_fn':function(_fn){
                                 return fn[_fn];
                            },
                            '_set_fn':function(_fn,obj){
                                fn[_fn]=obj;
                            }
                        };
                    
                        this.seter=function(){
                            return _cell_api._set_fn;
                        }
                        this.geter=function(){
                         return _cell_api._get_fn.apply(this,arguments);
                        }
                    });
                    _ndMgrClass.prototype.listeners=function(key,arrayArg){
                       this._fn_parser(arrayArg,'__'+key); 
                   };
                    _ndMgrClass.prototype.childEventListeners=function(arrayArg){
                       this._fn_parser(arrayArg,'_childEventListeners'); 
                   };
                   _ndMgrClass.prototype.global=function(key,arrayArg){
                       this._fn_parser(arrayArg,'_$'+key);
                    };
                   

    _ndMgrClass=merge(_ndMgrClass,_CellClass);
    function filters() {
        api.filters(arguments[0], arguments[1]);
    }
    function start(){
        api.start(arguments);
    }
    function factory() {
        api.factory(arguments[0], arguments[1]);
    }

    function constants() {
        api.constants(arguments[0], arguments[1]);
    }

    function routes(){
        api.routes(arguments[0], arguments[1]);
    }

    function controller(){
        api.controller(arguments[0], arguments[1]);
    }

    function module(){
        api.module(arguments[0], arguments[1]);
    }
    function nodeMgr(){
        api.nodeMgr(arguments[0], arguments[1], arguments[2]);
    }
     function node(){
        api.node(arguments[0], arguments[1]);
    }
    function initiate(){
        resources.config({mode :'history'});
        resources.listen();

        if (typeof String.prototype.startsWith != 'function') {
          // see below for better implementation!
          String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
          };
        }
    }

    initiate();

    return {
        'nxfilters': filters,
        'factory': factory,
        'routes': routes,
        'controller': controller,
        'constants': constants,
        'module': module,
        'nodeMgr': nodeMgr,
        'node':node,
        'start':start
    }
});

function merge(o, p) {
for(prop in p.prototype) { // For all props in p.
if (o.hasOwnProperty[prop]) continue; // Except those already in o.
o.prototype[prop] = p.prototype[prop]; // Add the property to o.
}
return o;
}
