
// External event functions ======================================================================================================
// ===============================================================================================================================



function setCtrlStatus(event, prjManager,option) {
    if (option === 'press') {
        prjManager.uiStatus.isCtrl = true;
    } else {
        prjManager.uiStatus.isCtrl = false;
    }
    console.log('ctrl pressed!!!!!!', prjManager.uiStatus.isCtrl)


    if (prjManager.mode === 'create') hoverElement(prjManager,isRendering=true);
}

// XXX : do with drag
function canvasDrag(event,prjManager,opt) {
    if (opt=='down') {

        let [X1,Y1] = sub_roundXY(prjManager,deg=0)
        if (!X1) return;
    
        prjManager.uiStatus.dragClicked = true; // Activate drag mode
        prjManager.uiStatus.clickedPoint1 = [X1,Y1]; // Set start point
        prjManager.uiStatus.clickedPoint2 = [X1,Y1]; // Set start point
    

    } else if (opt=='move') {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = sub_roundXY(prjManager,deg=0,bound=false) // unbounded mouse drag
        prjManager.uiStatus.clickedPoint2 = [X2,Y2]
        
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);

        // drag object range change
        sub_modifyLine(prjManager,'drag', { x: [[Xmin,Xmax,Xmax,Xmin,Xmin]], y: [[Ymin,Ymin,Ymax,Ymax,Ymin]] });
        
    } else {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = prjManager.uiStatus.clickedPoint2
        prjManager.uiStatus.dragClicked = false; // Deactivate drag mode
        prjManager.uiStatus.clickedPoint1 = [];
        prjManager.uiStatus.clickedPoint2 = [];
    
        if (!X1 | !X2 | !Y1 | !Y2) return;    
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);
    
        // Perform action on drag
        sub_modifyLine(prjManager, 'drag', { x: [[]], y: [[]] });
        
        // drag
        //
        //               
    }
}

hotkeyObj = {
    '1':'nodeline',
    '2':'source',
    '3':'ground',
    '4':'resistor',
    '5':'capacitor',
    '6':'nmos',
    '7':'pmos',
    '8':'ots',
    '9':'mtj',
    '0':'nonlin',
    't':'text',
}
function selectElement(event,prjManager) {

    prjManager.data.counter = prjManager.data.counter + 1;

    let elementName
    if (event.type=='keydown') {
        if (!elementName in hotkeyObj) return;
        elementName = hotkeyObj[event.key]
    } else if (event.type ==='mousedown') {
        elementName = event.target.id.replace('btn-','');    
    } // else if pastemode : clipboard에서 임시 객체들 가져와서 tempData에 옮기자자

    // uiData update by clicked circuit element    
    // prjManager.createElement.name = elementName;
    if (elementName == 'nodeline') { // nodeline


        // click 모드인 경우 nodegroup obj 생성 후 tempData에 옮기자

        // node segment는 nodegroup 생성되면 다 제거하고, terminal은 남겨놓자.
        // 아예 segment는 등록을 하지 말고 nodegroup을 element class로 격상하자
        // 그러니까 element, terminal, nodegroup 세 type으로!

        
        const nodePointerShape = prjManager.circuitData.shapeset.shape_nodepnt;
        let elementId = 'eid'+prjManager.data.counter;
        let currentElement = new Node(elementName, elementId);
        currentElement.elementStatus = 'normal';
        prjManager.tempData.nodeInfo.shape = nodePointerShape;
        prjManager.tempData.nodeInfo.startingXY = [];
        prjManager.tempData.nodeInfo.endingXY = [];
        prjManager.tempData.currentMode = 'nodestart';

        prjManager.tempData.elements = {};
        prjManager.tempData.elements[elementId] = currentElement;

    } else { // normal element
 
        // create element object instance 
        const elementDefault = prjManager.circuitData.element[elementName]
        let elementId = 'eid'+prjManager.data.counter;
        let currentElement = new Element(elementName, elementId);
        currentElement.elementStatus = 'nopara';
        currentElement.polarity = elementDefault.polarity;
        currentElement.rotation = elementDefault.rotation;
        currentElement.relative.shape = elementDefault.shape;
        currentElement.relative.shapeN = elementDefault.shapeN;
        currentElement.relative.terminal = elementDefault.terminal;

        prjManager.tempData.elements = {};
        prjManager.tempData.elements[elementId] = currentElement;
        prjManager.tempData.currentMode = 'element';
        
    }
    
    // html control : remove / set "btn-clicked" class 
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });    
    document.getElementById('btn-'+elementName).classList.add('btn-clicked');

    // set mode to "create mode"
    prjManager.setMode('create')

    // hover rendering
    hoverElement(prjManager,isRendering=true)
}

// XXX highlight
function hoverElement(prjManager,isRendering=false) {

    
    //////// 이거 전면수정하자. copy paste도 커버할 수 있도록.
    // 일단 select Element 또는 select Paste mode가 되면, elementGroups, nodeGroups를 createElement에다 임시객체로 옮기고
    // hoverElement에서는 이 임시객체를 다루는 일만 하자.
    // xy offset 주고, validity check 하고, related node highlight (신설) 하고.
    // rotate, switch도 얘네들을 다 커버할 수 있도록 수정하자.
    // 그리고 createElement를 누르면, 임시 객체를 그냥 실제 객체로 옮겨서 등록하는 일만 하면 되겠지. 물론 nodegroup은 다시 계산해야겠지만.
    // 근데 그 조차도 이미 node hover 시 related node highlight에 다 있음.


    // activate when XY grid changes 
    const hoverPoint = prjManager.uiStatus.hoverPoint
    const hoverPointContinuous = prjManager.uiStatus.hoverPointContinuous
    let XY;
    let continuousXY;
    if (isRendering) { // element select by hotkey
        XY = hoverPoint
        continuousXY = hoverPointContinuous
    } else {
        XY = sub_roundXY(prjManager,deg=2)
        if (hoverPoint.length != 0 && hoverPoint[0] == XY[0] && hoverPoint[1] == XY[1]) return;
        continuousXY = sub_roundXY(prjManager,deg=0)
    }
    prjManager.uiStatus.hoverPoint = XY





    let hoverShape = [];
    let currentMode = prjManager.tempData.currentMode;

    // const isNodeline = prjManager.createElement.name === 'nodeline'
    if (currentMode==='nodestart') { // nodeline mode

        const nodePointerShape = prjManager.tempData.nodeInfo.shape;

        const tempElements = prjManager.tempData.elements;
        // element shift to XY        
        for (let key in tempElements) {
            element = tempElements[key];
            element.shiftStart(XY);
        }
        hoverShape = sub_shiftShape(nodePointerShape, XY);        


    } else if (currentMode==='nodeend') {
        
        const nodePointerShape = prjManager.tempData.nodeInfo.shape;

        const startingXY = prjManager.tempData.nodeInfo.startingXY;
        const tempElements = prjManager.tempData.elements;
        let endingXY;
        // element shift to XY        
        for (let key in tempElements) {
            element = tempElements[key];
            element.shift(startingXY,XY,continuousXY);
            endingXY = element.segments[0][1];
            hoverShape = sub_concatXYs(hoverShape, element.shape);
        }
        
        let hoverShapeCircle = sub_shiftShape(nodePointerShape, endingXY); 
        hoverShape = sub_concatXYs(hoverShape,hoverShapeCircle);

    } else { // normal element
        const tempElements = prjManager.tempData.elements;
        // element shift to XY        
        for (let key in tempElements) {
            element = tempElements[key];
            element.shift(XY);
            hoverShape = sub_concatXYs(hoverShape, element.shape);
        }
    }   

    // validity check
    let {overlappedIdList,isValid} = sub_checkOverlap(prjManager)    
    overlappedIdList = [...new Set(overlappedIdList)];
    
    prjManager.tempData.isValid = isValid; 
    prjManager.tempData.overlappedIdList = overlappedIdList; 
    lineColor = isValid ? 'rgb(190,190,190)' : 'rgb(255, 112, 112)';

    // main element rendering
    sub_modifyLine(prjManager, 'lineCreateNormal', { x: [hoverShape[0]], y: [hoverShape[1]], 'line.color': lineColor});

    // relevant element rendering (highlight)
    if (overlappedIdList.length === 0) {
        sub_modifyLine(prjManager,'lineRelevant',[]);
    } else {
        let lineRelevant = [[],[]];
        let elementsObj = prjManager.data.elements;
        for (const elementId of overlappedIdList) {
            let element = elementsObj[elementId];
            lineRelevant = sub_concatXYs(lineRelevant,element.shape);
        };
        sub_modifyLine(prjManager,'lineRelevant',lineRelevant);
    }

}


// XXX : nodeline 완성 필요
function createElement(event,prjManager) {

    // validity check
    if (!prjManager.tempData.isValid) return

    // nodeline
    if (prjManager.tempData.currentMode === 'nodestart') {
        prjManager.tempData.currentMode = 'nodeend';
        prjManager.tempData.nodeInfo.startingXY = sub_roundXY(prjManager,deg=2);
        hoverElement(prjManager,isRendering=true);
        return

    } else if (prjManager.tempData.currentMode === 'nodeend') {
        prjManager.tempData.currentMode = 'nodestart';
    }


    // register new element & map
    prjManager.data.elements = {...prjManager.data.elements, ...structuredClone(prjManager.tempData.elements)};

    let elements = prjManager.data.elements;
    let tempElements = prjManager.tempData.elements;
    // node merge
    let targetIdList = prjManager.tempData.overlappedIdList;
    for (let key in prjManager.tempData.elements) {
        if (prjManager.tempData.elements[key].elementName != 'nodeline') continue;
        targetIdList.push(key);
    }
    let targetElements = {};
    for (let key of targetIdList) targetElements[key] = prjManager.data.elements[key];   

    let isCtrl = prjManager.uiStatus.isCtrl;
    let nodeGroups = sub_checkNodeGroups(targetElements,isCtrl)

    // generate representative node (mergedNode) and delete others
    let deleteIdList = [];
    for (let nodeGroup of nodeGroups) {
        if (nodeGroup.length === 1) continue;
        let representativeId = nodeGroup[0];
        let otherIdList = nodeGroup.slice(1);
        let mergedNode = elements[representativeId];
        console.log('instance??', mergedNode instanceof Node); // true여야 함
        mergedNode = sub_mergeNodes(elements,representativeId,otherIdList);
        elements[representativeId] = mergedNode;
        deleteIdList = [...deleteIdList, ...otherIdList];        
    };
    deleteIdList.forEach(key => delete elements[key]);


    console.log('overlappedIdList',prjManager.tempData.overlappedIdList)
    console.log('targetElements',targetElements)
    console.log('nodegroup',nodeGroups)
    console.log('elements',elements)
    console.log('prj',prjManager)

    

    // temp data id update
    const newtempElements = {};
    for (let key in tempElements) {
        prjManager.data.counter = prjManager.data.counter + 1;
        let element = tempElements[key];
        let newKey = 'eid'+prjManager.data.counter;
        element.elementId = newKey;
        newtempElements[newKey] = element;
    } 
    prjManager.tempData.elements = newtempElements;


    // graph obj rendering ==> 나중에 이건 따로 함수로 뺴자-----------------------------------
    let lineNormal = [[],[]];
    let lineNoPara = [[],[]];
    let lineError = [[],[]];
    let markerNormal = [[],[]];
    let markerError = [[],[]];
    // let polaritylineNormal = [[],[]];
    // let polaritylineNoPara = [[],[]];
    // let polaritylineError = [[],[]];


    for (const elementId in elements) {
        let element = elements[elementId];
         // main element shape line, polarity line
        if (element.elementStatus == 'normal') {
            lineNormal = sub_concatXYs(lineNormal,element.shape);
        } else if (element.elementStatus == 'error') {
            lineError = sub_concatXYs(lineError,element.shape);
        } else if (element.elementStatus == 'nopara') {
            lineNoPara = sub_concatXYs(lineNoPara,element.shape);
        }

        if (element.elementName == 'nodeline') {
            markerNormal = sub_concatXYs(markerNormal,element.joints);
        }
    }

    sub_modifyLine(prjManager,'lineNormal',lineNormal)
    sub_modifyLine(prjManager,'lineNoPara',lineNoPara)
    sub_modifyLine(prjManager,'lineError',lineError)
    sub_modifyLine(prjManager,'markerNormal',markerNormal)
    sub_modifyLine(prjManager,'markerError',markerError)

    // ---------------------------------------------------------------------------------------------------------

    // hover rendering
    hoverElement(prjManager,isRendering=true) 

    // delta calc for undo/redo

}

function rotateElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];      
        element.rotate();
    }    
    hoverElement(prjManager,isRendering=true);
}

function flipElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];      
        element.flip();
    }    
    hoverElement(prjManager,isRendering=true);
}

// XXX
function selectOption(event,prjManager) {

}

// XXX
function deleteElement(event,prjManager) {

}

// XXX
function copyElement(event,prjManager) {

}

// XXX
function pasteElement(event,prjManager) {

}


// function rotateElement(event,prjManager) {
//     let elementName = prjManager.createElement.name;
//     if (elementName === 'text' || elementName === 'nodeline') return;
//     // 90deg rotation in clock-wise
//     prjManager.createElement.rotation = (prjManager.createElement.rotation + 1) % 4;
//     prjManager.createElement.shape = sub_rotateVectors(prjManager.createElement.shape);
//     prjManager.createElement.terminal = sub_rotateVectors(prjManager.createElement.terminal);
//     // hover rendering
//     hoverElement(prjManager,isRendering=true)
// }

// function switchElement(event,prjManager) {
//     let elementName = prjManager.createElement.name;
//     if (elementName === 'text' || elementName === 'nodeline') return;
//     // flip under y-axis (x -> -x)
//     prjManager.createElement.polarity = (prjManager.createElement.polarity + 1) % 2;
//     prjManager.createElement.shape = sub_flipVectors(prjManager.createElement.shape);   
//     prjManager.createElement.terminal = sub_flipVectors(prjManager.createElement.terminal);
//     // hover rendering
//     hoverElement(prjManager,isRendering=true)
// }

// XXX
function saveProject(event,prjManager) {

}

// XXX
function resetMode(event,prjManager) {
    prjManager.mode = 'normal';
    prjManager.resetUiStatus();
    prjManager.resetTempData();
    sub_modifyLine(prjManager,'lineCreateNormal',[]);
    sub_modifyLine(prjManager,'lineRelevant',[]);
}

function canvasResize(_, prjManager) {

    const width_left = 80;
    const width_right = 200;
    const actualWidth = window.innerWidth / window.devicePixelRatio;
    const actualHeight = window.innerHeight;
    const count_right = 4 - document.querySelectorAll('.hidden').length;
    const height_top_offset = document.querySelector('.container-title').offsetHeight;

    prjManager.plotObject.canvas.style.width = `${actualWidth - width_left - width_right * count_right}px`;
    prjManager.plotObject.canvas.style.height = `${actualHeight - height_top_offset - 50}px`;

    prjManager.plotObject.Plotly.relayout('canvas', {
        width: prjManager.plotObject.canvas.offsetWidth - 2,
        height: prjManager.plotObject.canvas.offsetHeight - 2,
    });

    sub_rerangeCanvas(prjManager);
    return
}

function canvasWheel(event, prjManager) {
    const canvas = prjManager.plotObject.canvas;
    if (!canvas.contains(event.target)) return;


    // 플롯 크기 및 현재 범위 가져오기
    const plot = canvas._fullLayout;
    const width = plot.width;
    const height = plot.height;

    const currentXRange = plot.xaxis.range; // [xmin, xmax]
    const currentYRange = plot.yaxis.range; // [ymin, ymax]

    const xRangeSize = currentXRange[1] - currentXRange[0];
    const yRangeSize = currentYRange[1] - currentYRange[0];


    
    let rect = canvas.getBoundingClientRect();
    let startX = event.clientX - rect.left;
    let startY = event.clientY - rect.top;

    // 마우스 위치를 그래프 좌표로 변환
    const mouseX = (startX / width) * xRangeSize + currentXRange[0];
    const mouseY = (1 - startY / height) * yRangeSize + currentYRange[0];

    // 줌 인/아웃 스케일 조정
    const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1; // 줌인(스크롤 위): 0.9, 줌아웃(스크롤 아래): 1.1
    const newPixelsPerUnit = prjManager.canvasProperty.pixelsPerUnit / zoomFactor;
    if (newPixelsPerUnit < prjManager.canvasProperty.minPixelsPerUnit) {
        prjManager.canvasProperty.pixelsPerUnit = prjManager.canvasProperty.minPixelsPerUnit
    } else if (newPixelsPerUnit > prjManager.canvasProperty.maxPixelsPerUnit) {
        prjManager.canvasProperty.pixelsPerUnit = prjManager.canvasProperty.maxPixelsPerUnit
    } else {
        prjManager.canvasProperty.pixelsPerUnit = newPixelsPerUnit;
    }

    // 새로운 범위 계산
    const newXRange = [
        Math.max(mouseX - (mouseX - currentXRange[0]) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(mouseX + (currentXRange[1] - mouseX) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(mouseY - (mouseY - currentYRange[0]) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(mouseY + (currentYRange[1] - mouseY) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[3])
    ];
    // 범위 업데이트
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}

function canvasMove(event,prjManager) {

    if (!prjManager.plotObject.canvas.layout) return;

    const currentXRange = prjManager.plotObject.canvas.layout.xaxis.range;
    const currentYRange = prjManager.plotObject.canvas.layout.yaxis.range;

    let newXRange = [...currentXRange];
    let newYRange = [...currentYRange];

    let keystep = prjManager.canvasProperty.arrowKeyStep /  prjManager.canvasProperty.pixelsPerUnit;

    switch (event.key) {
        case 'ArrowLeft': // 왼쪽 방향키
            newXRange = [
                Math.max(currentXRange[0] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
                Math.max(currentXRange[1] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
            ];
            break;
        case 'ArrowRight': // 오른쪽 방향키
            newXRange = [
                Math.min(currentXRange[0] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
                Math.min(currentXRange[1] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowUp': // 위쪽 방향키
            newYRange = [
                Math.min(currentYRange[0] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
                Math.min(currentYRange[1] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowDown': // 아래쪽 방향키
            newYRange = [
                Math.max(currentYRange[0] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
                Math.max(currentYRange[1] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
            ];
            break;
        default:
            return; // 다른 키는 무시
    }

    // X, Y축 범위 업데이트

    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}







function elem_toggleHidden(clickedid) {

    const clicked_element = document.getElementById(clickedid);
    const target_element = document.getElementById(clickedid.replace('btn','opt'));
    const is_hidden = target_element.classList.contains('hidden')
    
    if (is_hidden) {
        target_element.classList.remove('hidden');
        clicked_element.classList.add('btn-clicked');
    } else {
        target_element.classList.add('hidden');
        clicked_element.classList.remove('btn-clicked');
    }
    canvasResize([], prjManager)
}

