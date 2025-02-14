
// External event functions ======================================================================================================
// ===============================================================================================================================


function canvasDrag(event,prjManager,opt) {
    const canvas = prjManager.plotObject.canvas;
    if (opt=='down') {

        let [X1,Y1] = sub_roundXY(event,prjManager,deg=0)

        if (!X1) return;
    
        prjManager.uiStatus.dragClicked = true; // Activate drag mode
        prjManager.uiStatus.clickedPoint1 = [X1,Y1]; // Set start point
        prjManager.uiStatus.clickedPoint2 = [X1,Y1]; // Set start point
    

    } else if (opt=='move') {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = sub_roundXY(event,prjManager,deg=0,bound=false) // unbounded mouse drag
        prjManager.uiStatus.clickedPoint2 = [X2,Y2]
        // console.log(`Draging: Current position `,X2,Y2)
        
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);

        // drag object range change
        targetIndex = data.findIndex(trace => trace.name === 'lineObj_drag')
        prjManager.plotObject.Plotly.restyle('canvas',{ x: [[Xmin,Xmax,Xmax,Xmin,Xmin]], y: [[Ymin,Ymin,Ymax,Ymax,Ymin]] }, targetIndex);
        
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
        targetIndex = data.findIndex(trace => trace.name === 'lineObj_drag')
    
        prjManager.plotObject.Plotly.restyle('canvas',{ x: [[]], y: [[]] }, targetIndex);
        
        
        console.log('lets do something drag!!')
    }
}

function selectElement(event,prjManager) {

    let elementName
    if (event.type=='keydown') {
        switch (event.key) {
            case '1': elementName = 'nodepnt'; break;
            case '2': elementName = 'powersource'; break;
            case '3': elementName = 'ground'; break;
            case '4': elementName = 'resistor'; break;
            case '5': elementName = 'capacitor'; break;
            case '6': elementName = 'transistor'; break;
            case 't': elementName = 'text'; break;
            default: return;
        }
    } else if (event.type ==='mousedown') {
        elementName = event.target.id.replace('btn-','');
    }

    // uiData update by clicked circuit element    
    prjManager.createElement.name = elementName;
    prjManager.createElement.shape = prjManager.circuitData.shapeset['xy_'+prjManager.createElement.name]
    prjManager.createElement.shapeN = prjManager.circuitData.shapeset['xyn_'+prjManager.createElement.name]
    prjManager.createElement.polarity = 0;
    prjManager.createElement.nRotation = 0;
    
    // remove "btn-clicked" class from all buttons
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });
    
    // set "btn-clicked" class for the licked button
    document.getElementById('btn-'+elementName).classList.add('btn-clicked');

    // set mode to "create mode"
    prjManager.setMode('create')

    // rendering
    hoverElement(event,prjManager)

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

function hoverElement(event, prjManager) {
    const hoverPoint = prjManager.uiStatus.hoverPoint
    if (event.type === 'keydown') {
        XY = hoverPoint
    } else {
        XY = sub_roundXY(event,prjManager,deg=2)
        if (hoverPoint.length != 0 && hoverPoint[0] == XY[0] && hoverPoint[1] == XY[1]) return;
    }

    const shape = prjManager.createElement.shape;
    const shapeN = prjManager.createElement.shapeN;
    const polarity = prjManager.createElement.polarity;
    const nRotation = prjManager.createElement.nRotation;
    if (shape && shapeN) {

        let hoverXY = sub_shiftShapeMerged(shape, shapeN, XY); 
        targetIndex = data.findIndex(trace => trace.name === 'lineObj_elementCreateNormal')
        let isValid = sub_validityCheck(prjManager)
        if (isValid) {
            lineColor = 'rgb(190,190,190)';
        } else {
            lineColor = 'rgb(255, 112, 112)';
        }
        prjManager.plotObject.Plotly.restyle('canvas', { x: [hoverXY[0]], y: [hoverXY[1]], 'line.color': lineColor}, targetIndex);
    }
    prjManager.uiStatus.hoverPoint = XY
}

// XXX
function createElement(event,prjManager) {


    // validity check
    if (!sub_validityCheck(prjManager)) return


    // register new element 
    elementObjectArray = sub_createElementObject(prjManager)
    prjManager.data.element = {...prjManager.data.element, ...elementObjectArray}

    // register new element's pos <-> elementId

    // all shape rendering




    
    // if (!ui_data['selected_element']) return; // 선택된 element가 없으면 동작하지 않음
    // const shape = ui_data['selected_element_xy'];
    // if (shape) {
    //     targetIndex = data.findIndex(trace => trace.name === 'dataline')
    //     const currentX = plotElement.data[targetIndex].x; // 기존 x 데이터
    //     const currentY = plotElement.data[targetIndex].y; // 기존 y 데이터

    //     const [compX,compY] = sub_shapeToXY(shape, event)
    //     const updatedX = currentX.concat(compX);
    //     const updatedY = currentY.concat(compY);

    //     // 데이터 업데이트
    //     Plotly.restyle('canvas', { x: [updatedX], y: [updatedY] }, targetIndex);
    // }
}

// XXX
function rotateElement(event,prjManager) {
    if (prjManager.createElement.nRotation == 3) {prjManager.createElement.nRotation = 0}
    else {prjManager.createElement.nRotation = prjManager.createElement.nRotation + 1;}    
    prjManager.createElement.shape = sub_rotateVectors(prjManager.createElement.shape);
    // rendering
    hoverElement(event, prjManager)
}

// XXX
function switchElement(event,prjManager) {
    if (prjManager.createElement.polarity == 0) {prjManager.createElement.polarity = 1}
    else {prjManager.createElement.polarity = 0;} 
    prjManager.createElement.shape = sub_flipVectors(prjManager.createElement.shape);   
    // rendering
    hoverElement(event, prjManager)
}

// XXX
function saveProject(event,prjManager) {

}

// XXX
function resetMode(event,prjManager) {

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
    const newPixelsPerUnit = prjManager.canvasSizeVar.pixelsPerUnit / zoomFactor;
    if (newPixelsPerUnit < prjManager.canvasSizeVar.minPixelsPerUnit) {
        prjManager.canvasSizeVar.pixelsPerUnit = prjManager.canvasSizeVar.minPixelsPerUnit
    } else if (newPixelsPerUnit > prjManager.canvasSizeVar.maxPixelsPerUnit) {
        prjManager.canvasSizeVar.pixelsPerUnit = prjManager.canvasSizeVar.maxPixelsPerUnit
    } else {
        prjManager.canvasSizeVar.pixelsPerUnit = newPixelsPerUnit;
    }

    // 새로운 범위 계산
    const newXRange = [
        Math.max(mouseX - (mouseX - currentXRange[0]) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(mouseX + (currentXRange[1] - mouseX) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(mouseY - (mouseY - currentYRange[0]) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(mouseY + (currentYRange[1] - mouseY) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[3])
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

    let keystep = prjManager.canvasSizeVar.arrowKeyStep /  prjManager.canvasSizeVar.pixelsPerUnit;

    switch (event.key) {
        case 'ArrowLeft': // 왼쪽 방향키
            newXRange = [
                Math.max(currentXRange[0] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
                Math.max(currentXRange[1] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
            ];
            break;
        case 'ArrowRight': // 오른쪽 방향키
            newXRange = [
                Math.min(currentXRange[0] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
                Math.min(currentXRange[1] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowUp': // 위쪽 방향키
            newYRange = [
                Math.min(currentYRange[0] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
                Math.min(currentYRange[1] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowDown': // 아래쪽 방향키
            newYRange = [
                Math.max(currentYRange[0] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
                Math.max(currentYRange[1] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
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

