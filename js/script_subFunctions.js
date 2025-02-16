

// sub functions =================================================================================================================
// ===============================================================================================================================

function sub_XY2pos(XY) {
    if (Array.isArray(XY[0])) { // for array
        return XY[0].map((x, i) => x * 10000 + XY[1][i]);
    } else { // for point
        return XY[0]*10000 + XY[1]
    }
}

function sub_pos2XY(pos) {
    if (Array.isArray(pos)) { // for array
        return pos.map(p => [Math.floor(p/10000), p%10000])
    } else { // for point
        return [Math.floor(pos/10000), pos%10000]
    }    
}

function sub_validityCheck(prjManager) {
    // canvas range limit check
    const XY = prjManager.uiStatus.hoverPoint;
    const rangeLim = prjManager.canvasSizeVar.canvasRangeLimit
    if ( (XY[0] <= rangeLim[0]) || (XY[0] >= rangeLim[1]) || (XY[1] <= rangeLim[0]) || (XY[1] >= rangeLim[1]) ) return false

    // empty element array check
    if (Object.keys(prjManager.data.element).length == 0) return true
    
    // validity check 
    const existingType = prjManager.data.typeMap;
    const newType = prjManager.createElement.typeMap;
    for (const pos in newType) {
        if (pos in existingType) {
            let nowType = newType[pos];
            if (nowType === 'element') return false;
            else {
                if (existingType[pos] === 'element') return false;
            }
        }
    }
    return true;
}

function sub_createNodeObject(prjManager) {
    
    let elementObjSet = {};   
    let idMapObj = {};
    let typeMapObj = {};

    // nodeline object
    prjManager.data.counterElement += 1; 
    const elementName = prjManager.createElement.name;
    const paraNames = prjManager.circuitData.element[elementName].paraNames;
    const shapeMerged = prjManager.createElement.node.shape;
    const posIds = prjManager.createElement.node.posIds;
    let elementObj = {
        elementId: prjManager.data.counterElement,
        positionId: posIds,
        name: elementName,
        shapeMerged: shapeMerged,
        paraNames: paraNames,
        paraValues: null,
        elementStatus: 'normal',
    };
    elementObjSet[elementObj.elementId] = elementObj;
    idMapObj = sub_mapXYToId(idMapObj, elementObj.positionId, elementObj.elementId);
    typeMapObj = sub_mapXYToId(typeMapObj, elementObj.positionId, 'nodeline');

    // node merger
    if (prjManager.createElement.node.isCtrl) {
        endingPosId = []
    } else {
        endingPosId = sub_XY2pos(shapeMerged);
    }
    sub_nodeMerger(elementObj, prjManager, endingPosId);

    prjManager.data.element = {...prjManager.data.element, ...elementObjSet}
    prjManager.data.idMap = {...prjManager.data.idMap, ...idMapObj}
    prjManager.data.typeMap = {...prjManager.data.typeMap, ...typeMapObj}
}


function sub_createElementObject(prjManager) {

    let elementObjSet = {};   
    let idMapObj = {};
    let typeMapObj = {};
    prjManager.data.counterElement += 1; 

    // main element object
    const elementName = prjManager.createElement.name;
    const XY = prjManager.uiStatus.hoverPoint;
    const shape = prjManager.createElement.shape;
    const shapeN = prjManager.createElement.shapeN;
    const shapeMerged = sub_shiftShapeMerged(shape, shapeN, XY);
    const terminal = prjManager.createElement.terminal;
    const terminalShifted = sub_shiftShapeMerged(terminal, [], XY);
    const nTerminal = terminal[0].length
    const paraNames = prjManager.circuitData.element[elementName].paraNames;
    const createSlaveId = (n, m) => Array.from({ length: n }, (_, i) => m + i + 1);

    const masterId = prjManager.data.counterElement;
    let elementObj = {
        elementId: prjManager.data.counterElement,
        positionId: [sub_XY2pos(XY)],
        name: elementName,
        polarity: prjManager.createElement.polarity,
        rotation: prjManager.createElement.rotation,
        shapeMerged: shapeMerged,
        paraNames: paraNames,
        paraValues: null,
        elementStatus: 'nopara',
        slaveId: createSlaveId(nTerminal, prjManager.data.counterElement),
    };
    elementObjSet[elementObj.elementId] = elementObj;
    idMapObj = sub_mapXYToId(idMapObj, elementObj.positionId, elementObj.elementId)
    typeMapObj = sub_mapXYToId(typeMapObj, elementObj.positionId, 'element')

    // terminal objects (slaves)
    for (let i = 0; i < nTerminal; i++) {
        let terminalXY = [[terminalShifted[0][i]], [terminalShifted[1][i]]]
        prjManager.data.counterElement += 1;
        let elementObj = {
            elementId: prjManager.data.counterElement,
            positionId: [sub_XY2pos(terminalXY)],
            name: 'terminal',
            elementStatus: 'normal',
            shapeMerged: terminalXY,
            masterId:masterId,
        };
        elementObjSet[elementObj.elementId] = elementObj;
        idMapObj = sub_mapXYToId(idMapObj, elementObj.positionId, elementObj.elementId);
        typeMapObj = sub_mapXYToId(typeMapObj, elementObj.positionId, 'terminal');

        // node merger
        sub_nodeMerger(elementObj, prjManager, []);
    }
    
    prjManager.data.element = {...prjManager.data.element, ...elementObjSet}
    prjManager.data.idMap = {...prjManager.data.idMap, ...idMapObj}
    prjManager.data.typeMap = {...prjManager.data.typeMap, ...typeMapObj}    
}

function sub_nodeMerger(elementObj, prjManager, endingPosId) {

    // 이거 전면 수정하자.
    // 생각해보니, 기존 nodeline의 endpoint + new nodeline의 midpoint 경우도 merge가 되어야 함...
    // 아 그리고 시발 그 결절 부분에 scatter 추가하는것도 있네..ㄷㄷ 


    let posIds = elementObj.positionId;
    let elementId = elementObj.elementId;
    let pos2nodeGroup = prjManager.data.pos2nodeGroup
    let nodeGroup2Id = prjManager.data.nodeGroup2Id
    let group;

    if (endingPosId.length === 0) endingPosId = posIds;

    console.log('endingPosId',endingPosId)
    // check if group exists
    isNewGroup = true;
    for (pos of endingPosId) {
        if (pos in pos2nodeGroup) {
            group = pos2nodeGroup[pos];
            isNewGroup = false;
            break;
        }
    }
    if (isNewGroup) {
        prjManager.data.counterNodeGroup =+ 1;
        group = prjManager.data.counterNodeGroup;
    }

    // pos2nodeGroup update
    posIds.forEach(pos => pos2nodeGroup[pos] = group);

    // nodeGroup2Id update
    if (isNewGroup) {
        nodeGroup2Id[group] = [elementId];
    } else {
        nodeGroup2Id[group].push(elementId);
    }

    prjManager.data.pos2nodeGroup = pos2nodeGroup
    prjManager.data.nodeGroup2Id = nodeGroup2Id


    console.log(prjManager.data)
}


function sub_mapXYToId(mapInfo,positionId,value) {
    for (const Id of positionId) {
        mapInfo[Id] = value;
      }
    return mapInfo;
}

function sub_rerangeCanvas(prjManager) {
    // 플롯의 실제 크기 가져오기

    const plot = prjManager.plotObject.canvas._fullLayout;
    const width = plot.width;  // 플롯 내부 너비
    const height = plot.height; // 플롯 내부 높이

    // 현재 X, Y축의 범위 가져오기
    const currentLayout = prjManager.plotObject.canvas.layout;
    const currentXRange = currentLayout.xaxis.range; // [xmin, xmax]
    const currentYRange = currentLayout.yaxis.range; // [ymin, ymax]

    // 현재 중심 계산
    const xCenter = (currentXRange[0] + currentXRange[1]) / 2;
    const yCenter = (currentYRange[0] + currentYRange[1]) / 2;

    // 새로운 X, Y축 범위 계산 (중심 기준)
    const xRange = width / prjManager.canvasSizeVar.pixelsPerUnit / 2;
    const yRange = height / prjManager.canvasSizeVar.pixelsPerUnit / 2;

    const newXRange = [
        Math.max(xCenter - xRange, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(xCenter + xRange, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(yCenter - yRange, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(yCenter + yRange, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];

    // Plotly의 축 범위 업데이트
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });

}

function sub_roundXY(event, prjManager, deg=2, bound=true) {
    
    let roundX, roundY
    const canvas = prjManager.plotObject.canvas;
    let rect = canvas.getBoundingClientRect();
    let startX = event.clientX - rect.left;
    let startY = event.clientY - rect.top;
    const plotLayout = canvas._fullLayout;
    const pntX =  plotLayout.xaxis.range[0] + (startX / plotLayout.width) * (plotLayout.xaxis.range[1] - plotLayout.xaxis.range[0])
    const pntY =  plotLayout.yaxis.range[1] - (startY / plotLayout.height) * (plotLayout.yaxis.range[1] - plotLayout.yaxis.range[0])

    if (deg == 0) {
        roundX = pntX;
        roundY = pntY;
    } else {
        roundX = Math.round((pntX - deg) / deg) * deg + deg;
        roundY = Math.round((pntY - deg) / deg) * deg + deg;
    }

    if (!bound) {
        const currentLayout = prjManager.plotObject.canvas.layout;
        const currentXRange = currentLayout.xaxis.range;
        const currentYRange = currentLayout.yaxis.range;
        roundX = Math.max(roundX, Math.min(currentXRange[0], currentXRange[1]));
        roundY = Math.max(roundY, Math.min(currentYRange[0], currentYRange[1]));
    }

    return [roundX,roundY]
}

function sub_shiftShapeMerged(shape, shapeN, offset) {
    let shapeShifted = sub_shiftShape(shape, offset);
    let shapeNShifted = sub_shiftShape(shapeN, offset);
    return sub_concatXYs(shapeShifted,shapeNShifted)
}

function sub_shiftShape(shape, offset) {
    if (!shape) return [];
    if (shape.length === 0) return [];
    let [mouseX,mouseY] = offset
    const [shapeX, shapeY] = shape;
    const Xdata = shapeX.map((val) => val === null ? null : val + mouseX);
    const Ydata = shapeY.map((val) => val === null ? null : val + mouseY);
    return [Xdata, Ydata]
}

function sub_rotateVectors(shapeXY) {
    let [X,Y] = shapeXY
    a=0; b=1; c=-1; d=0;
    const Xr = X.map((x, i) => x === null || Y[i] === null ? null : a * x + b * Y[i]);
    const Yr = Y.map((y, i) => X[i] === null || y === null ? null : c * X[i] + d * y);
    return [Xr, Yr];
}

function sub_flipVectors(shapeXY) {
    let [X,Y] = shapeXY
    X = X.map(num => -num)
    return [X,Y];
}

function sub_concatXYs(XY1, XY2) {  
    if (XY1.length === 0) return XY2;
    if (XY2.length === 0) return XY1;
    return XY1.map((row, i) => [...row, null, ...XY2[i]]);
}

function sub_modifyLine(prjManager, lineName, property) {

    targetIndex = prjManager.plotObject.lineData.findIndex(trace => trace.name === lineName)
    if (targetIndex == -1) {
        console.log(`No line obj named ${lineName} found!`);
        return;
    }

    if (Array.isArray(property)) {
        if (property.length === 0) {
            property = {x:[[]], y:[[]]}
        } else {
            property = {x: [property[0]], y: [property[1]]}
        }        
    }
    prjManager.plotObject.Plotly.restyle('canvas', property, targetIndex);

}

function sub_generateNodeLine(startingXY, event, prjManager) {

    let continuousXY = sub_roundXY(event, prjManager, deg=0, bound=true);
    let endingXY = sub_roundXY(event, prjManager, deg=2, bound=true);

    let deltaX = Math.abs(startingXY[0] - continuousXY[0]);
    let deltaY = Math.abs(startingXY[1] - continuousXY[1]);
    let posIds;

    if (deltaX > deltaY) { // x-dir. node guide line
        endingXY[1] = startingXY[1]; 
        let minX = Math.min(endingXY[0], startingXY[0]);
        let maxX = Math.max(endingXY[0], startingXY[0]);
        posIds = Array.from({ length: maxX - minX + 1 }, (_, i) => sub_XY2pos([minX+i,endingXY[1]]));

    } else { // y-dir. node guide line
        endingXY[0] = startingXY[0]; 
        let minY = Math.min(endingXY[1], startingXY[1]);
        let maxY = Math.max(endingXY[1], startingXY[1]);
        posIds = Array.from({ length: maxY - minY + 1 }, (_, i) => sub_XY2pos([endingXY[0],minY+i]));
    }

    return [endingXY, posIds];
}
