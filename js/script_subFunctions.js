

// sub functions =================================================================================================================
// ===============================================================================================================================


function sub_XY2pos(XY) {
    if (Array.isArray(XY[0])) { // for array
        return XY[0].map((x, i) => `${x},${XY[1][i]}`);
    } else { // for point
        return `${XY[0]},${XY[1]}`;
    }
}

function sub_pos2XY(pos) {
    if (Array.isArray(pos)) { // for array
        let X = [], Y = [];
        pos.forEach(p => {
            let [x, y] = p.split(',').map(Number);
            X.push(x);
            Y.push(y);
        });
        return [X,Y];
    } else { // for point
        return pos.split(',').map(Number)
    }    
}

function sub_checkOverlap(prjManager) {
    // canvas range limit check
    const XY = prjManager.uiStatus.hoverPoint;
    const rangeLim = prjManager.canvasProperty.canvasRangeLimit
    if ( (XY[0] <= rangeLim[0]) || (XY[0] >= rangeLim[1]) || (XY[1] <= rangeLim[0]) || (XY[1] >= rangeLim[1]) ) return {overlappedIdList:[],isValid:false};

    // empty element array check
    if (Object.keys(prjManager.data.elements).length == 0) return {overlappedIdList:[],isValid:true};
    
    // validity check 
    const isCtrl = prjManager.uiStatus.isCtrl;
    const oldElements = prjManager.data.elements;
    const newElements = prjManager.tempData.elements;
    let overlappedIdList = []

    for (let newKey in newElements) {
        let newElement = newElements[newKey]
        let newPosMap = newElement.posMap;
    
        for (let oldKey in oldElements) {
            let oldPosMap = oldElements[oldKey].posMap;
            let oldElementId = oldElements[oldKey].elementId;
            for (let newPos in newPosMap) {
                let newDirection = newPosMap[newPos].positionType;
                let newIsVertical = !newDirection[0] & newDirection[1] & !newDirection[2] & newDirection[3];
                let newIsHorizontal = newDirection[0] & !newDirection[1] & newDirection[2] & !newDirection[3];

                if (!(newPos in oldPosMap)) continue;
                if (newPosMap[newPos].elementType === 'element' || oldPosMap[newPos].elementType === 'element') return {overlappedIdList:[],isValid:false};
                if (newPosMap[newPos].elementType === 'terminal' || oldPosMap[newPos].elementType === 'terminal') continue;                
                if (!isCtrl && (newPosMap[newPos].elementType === 'node' && oldPosMap[newPos].elementType === 'node')) {
                    let oldDirection = oldPosMap[newPos].positionType;
                    let oldIsVertical = !oldDirection[0] & oldDirection[1] & !oldDirection[2] & oldDirection[3];
                    let oldIsHorizontal = oldDirection[0] & !oldDirection[1] & oldDirection[2] & !oldDirection[3];

                    let isInvalid = newDirection.some((val, i) => val && oldDirection[i]);
                    if (isInvalid) return {overlappedIdList:[],isValid:false};

                    if ( !((newIsVertical & oldIsHorizontal) || (newIsHorizontal & oldIsVertical)) ) overlappedIdList.push(oldElementId);
                } else overlappedIdList.push(oldElementId);                
            }
        }
    }
    overlappedIdList = [...new Set(overlappedIdList)];    
    return {overlappedIdList: overlappedIdList, isValid: true};;
}


function sub_checkNodeGroups(elements,isCtrl){
    let keys = Object.keys(elements);
    let parent = {}; 

    function find(x) {
        if (parent[x] === undefined) parent[x] = x; 
        if (parent[x] !== x) parent[x] = find(parent[x]); // 경로 압축
        return parent[x];
    }

    function union(x, y) {
        let rootX = find(x);
        let rootY = find(y);
        if (rootX !== rootY) parent[rootY] = rootX; // 그룹 병합
    }

    function checkIsSameNode(element1,element2,isCtrl) {
        let newPosMap = element1.posMap;
        let oldPosMap = element2.posMap;
        for (let newPos in newPosMap) {
            let newDirection = newPosMap[newPos].positionType;
            let newIsVertical = !newDirection[0] & newDirection[1] & !newDirection[2] & newDirection[3];
            let newIsHorizontal = newDirection[0] & !newDirection[1] & newDirection[2] & !newDirection[3];
            if (!(newPos in oldPosMap)) continue;      
            if (newPosMap[newPos].elementType === 'element' || oldPosMap[newPos].elementType === 'element') return false;
            console.log('newPosMap',newPosMap,'oldPosMap',oldPosMap,'newPos',newPos)
            if (!isCtrl && (newPosMap[newPos].elementType === 'node' && oldPosMap[newPos].elementType === 'node')) {
                let oldDirection = oldPosMap[newPos].positionType;
                let oldIsVertical = !oldDirection[0] & oldDirection[1] & !oldDirection[2] & oldDirection[3];
                let oldIsHorizontal = oldDirection[0] & !oldDirection[1] & oldDirection[2] & !oldDirection[3];
                if ( !((newIsVertical & oldIsHorizontal) || (newIsHorizontal & oldIsVertical)) ) return true;
            } else return true;            
        }    
    }    

    // check every pair and merge group
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            if (checkIsSameNode(elements[keys[i]], elements[keys[j]],isCtrl)) union(keys[i], keys[j]);
        }
    }

    let groups = {};
    for (let key of keys) {
        let root = find(key);
        if (!groups[root]) groups[root] = [];
        groups[root].push(key);
    }
    return Object.values(groups);
}

function sub_removeKeys(obj,keys) {
    keys.forEach(key => delete obj[key]);
    return obj
}

function sub_createNodeGroups(elementObj, prjManager) {
    let oldNodeGroups = prjManager.data.nodeGroups;
    let typeMapObj = prjManager.data.typeMap;
    prjManager.data.counter += 1;

    // temp node group
    let newNodeGroup = {
        nodeId: 'nodeId'+prjManager.data.counter,
        elementIdList:[elementObj.elementId],
        segmentList:[],
        terminalPositionId:[],
        edgePositionId:[],
        bodyPositionId:[],
        jointPositionId:[],
        shapeMerged:[],
    }
    if (elementObj.name==='terminal') {
        newNodeGroup.terminalPositionId = elementObj.positionId[0];
    } else if (elementObj.name==='node') {
        let [x1,x2] =elementObj.shapeMerged[0];
        let [y1,y2] =elementObj.shapeMerged[1];
        let segment = [[x1,y1],[x2,y2]];
        newNodeGroup.segmentList = [segment];
        newNodeGroup.shapeMerged = elementObj.shapeMerged;
    };
    newNodeGroup = sub_identifyPosType(newNodeGroup);

    if (Object.keys(oldNodeGroups).length === 0) { 
        // initialize empty nodeGroups
        mergedIdList = []; 
    } else {
        // find overlapped node groups to the new node group 
        let isCtrl = prjManager.uiStatus.isCtrl;
        mergedIdList = sub_findoverlappedNodeGroups(newNodeGroup, oldNodeGroups, isCtrl);
        // merge node groups into new merged node group
        newNodeGroup = sub_mergeNodeGroups(newNodeGroup, oldNodeGroups, mergedIdList);
        newNodeGroup = sub_identifyPosType(newNodeGroup);
    }
    
    // remove old. node groups and add new merged node group
    oldNodeGroups = sub_removeKeys(oldNodeGroups,mergedIdList)
    oldNodeGroups[newNodeGroup.nodeId] = newNodeGroup;
    prjManager.data.typeMap = {...prjManager.data.typeMap, ...newNodeGroup.posMap};

    prjManager.data.nodeGroups = oldNodeGroups;

    return
}

function sub_identifyPosType(nodeGroup) {
    let segmentList = nodeGroup.segmentList;
    let terminalPositionId = nodeGroup.terminalPositionId;
    let nodeId = nodedGroup.nodeId;

    let posMap = {};
    function sub_addPoint(nodeId, key, newDirection, terminalPositionId, posMap) {
        if (key in posMap) {
            let oldDirection = posMap[key];
            newDirection = oldDirection.map((val, index) => val || newDirection[index]);
        }
        if (terminalPositionId.includes(key)) elementType = 'terminal';
        else elementType = 'node';
        posMap[key] = {elementId:nodeId,elementType:elementType,positionType:newDirection};

        return posMap
    }
    
    for (segment of segmentList) {
        let [x1, y1] = segment[0]; // starting point
        let [x2, y2] = segment[1]; // ending point

        isHorizontal = Math.abs(y1-y2) < 0.5;

        if (isHorizontal) { // horizontal segment
            const start = Math.min(x1, x2);
            const end = Math.max(x1, x2);
            for (let x = start; x <= end; x+=2) {
                if (x == x1) direction = [true,false,false,false];
                else if (x == x2) direction = [false,false,true,false];
                else direction = [true,false,true,false];
                key = sub_XY2pos([x,y1]);
                posMap = sub_addPoint(nodeId, key, direction, terminalPositionId, posMap);
            }
        } else { // vertical segment
            const start = Math.min(y1, y2);
            const end = Math.max(y1, y2);
            for (let y = start; y <= end; y+=2) {
                if (y == y1) direction = [false,true,false,false];
                else if (y == y2) direction = [false,false,false,true];
                else direction = [false,true,false,true];
                key = sub_XY2pos([x1,y]);
                posMap = sub_addPoint(nodeId, key, direction, terminalPositionId, posMap);
            }
        }
    }
    nodeGroup.posMap = posMap;
    return nodeGroup;
}

function sub_findoverlappedNodeGroups(newNodeGroup, oldNodeGroups,isCtrl) {    
    
    function sub_hasCommonElement(A, B) {
        const setB = new Set(B); 
        return A.some(element => setB.has(element));
    }
    
    let mergedIdList = [];   

    if (isCtrl) { // nodegroup w/ any duplicate position Id
        let newPositionId = Object.keys(newNodeGroup.posMap);
        for (key in oldNodeGroups) {
            let oldPositionId = Object.keys(oldNodeGroups[key].posMap);
            if (sub_hasCommonElement(newPositionId,oldPositionId)) mergedIdList.push(key);
        }
    } else {
        let newPosMap = newNodeGroup.posMap;        
        for (key in oldNodeGroups) {
            let oldPosMap = oldNodeGroups[key].posMap;

            isMerged = false;
            for (newPos in newPosMap) {
                if (isMerged) break;
                let newPosInfo = newPosMap[newPos];
                let newDirection = newPosInfo.positionType;
                let newIsVertical = !newDirection[0] & newDirection[1] & !newDirection[2] & newDirection[3];
                let newIsHorizontal = newDirection[0] & !newDirection[1] & newDirection[2] & !newDirection[3];
                
                if (!(newPos in oldPosMap)) continue;                
                let oldPosInfo = oldPosMap[newPos];
                let oldDirection = oldPosInfo.positionType;
                let oldIsVertical = !oldDirection[0] & oldDirection[1] & !oldDirection[2] & oldDirection[3];
                let oldIsHorizontal = oldDirection[0] & !oldDirection[1] & oldDirection[2] & !oldDirection[3];
                if ( !((newIsVertical & oldIsHorizontal) || (newIsHorizontal & oldIsVertical)) ) {
                    isMerged = true;
                    break
                }                    
            }
            if (isMerged) mergedIdList.push(oldNodeGroups[key].nodeId);
        }
    }
    return mergedIdList
}

function sub_mergeNodeGroups(newNodeGroup, oldNodeGroups, mergedIdList) {

    let elementIdList = newNodeGroup.elementIdList;
    let segmentList = newNodeGroup.segmentList;
    let terminalPositionId = newNodeGroup.terminalPositionId;
    let shapeMerged = newNodeGroup.shapeMerged;

    for (let key of Object.keys(oldNodeGroups)) {
        let nodeGroup = oldNodeGroups[key];
        if (!mergedIdList.includes(nodeGroup.nodeId)) continue;
        elementIdList = [...elementIdList, ...nodeGroup.elementIdList];
        segmentList = [...segmentList, ...nodeGroup.segmentList];
        terminalPositionId = [...terminalPositionId, ...nodeGroup.terminalPositionId];
        shapeMerged = sub_concatXYs(shapeMerged,nodeGroup.shapeMerged);
    }

    newNodeGroup.elementIdList = elementIdList;
    newNodeGroup.segmentList = segmentList;
    newNodeGroup.terminalPositionId = terminalPositionId;
    newNodeGroup.shapeMerged = shapeMerged

    return newNodeGroup;   
}

function sub_mergeNodes(elements,representativeId,otherIdList) {
    let mergedNode = elements[representativeId];
    for (let elementId of otherIdList) {
        let otherNode = elements[elementId];
        mergedNode.segments.push(...otherNode.segments);
        mergedNode.terminalIds.push(...otherNode.terminalIds);
    };
    Node.renderShape(mergedNode);
    return mergedNode;
}

function sub_mapXYToId(mapInfo,positionId,elementId,elementType,positionType) {
    for (const Id of positionId) mapInfo[Id] = {elementId:elementId,elementType:elementType,positionType:positionType};
    return mapInfo;
}

function sub_rerangeCanvas(prjManager) {
    const plot = prjManager.plotObject.canvas._fullLayout;
    const width = plot.width;
    const height = plot.height;

    const currentLayout = prjManager.plotObject.canvas.layout;
    const currentXRange = currentLayout.xaxis.range; // [xmin, xmax]
    const currentYRange = currentLayout.yaxis.range; // [ymin, ymax]
    
    const xCenter = (currentXRange[0] + currentXRange[1]) / 2;
    const yCenter = (currentYRange[0] + currentYRange[1]) / 2;
    const xRange = width / prjManager.canvasProperty.pixelsPerUnit / 2;
    const yRange = height / prjManager.canvasProperty.pixelsPerUnit / 2;

    const newXRange = [
        Math.max(xCenter - xRange, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(xCenter + xRange, prjManager.canvasProperty.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(yCenter - yRange, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(yCenter + yRange, prjManager.canvasProperty.canvasRangeLimit[3])
    ];

    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });

}

function sub_roundXY(prjManager, deg=2, bound=true) {
    
    let roundX, roundY
    const canvas = prjManager.plotObject.canvas;
    let rect = canvas.getBoundingClientRect();
    let startX = prjManager.uiStatus.currentXY[0] - rect.left;
    let startY = prjManager.uiStatus.currentXY[1] - rect.top;
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
    let [offsetX,offsetY] = offset
    const [shapeX, shapeY] = shape;
    const Xdata = shapeX.map((val) => val === null ? null : val + offsetX);
    const Ydata = shapeY.map((val) => val === null ? null : val + offsetY);
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
    if (XY2 === null) XY2 = [[null,null]];
    return XY1.map((row, i) => [...row, null, ...XY2[i]]);
}

function sub_modifyLine(prjManager, lineName, property) {
    targetIndex = prjManager.plotObject.lineDataMap[lineName];
    if (Array.isArray(property)) {
        if (property.length === 0) {
            property = {x:[[]], y:[[]]};
        } else {
            let x = property[0];
            let y = property[1];
            property = {x: [x], y: [y]};
        }        
    }
    prjManager.plotObject.Plotly.restyle('canvas', property, targetIndex);
}

function sub_generateNodeLine(startingXY, endingXY, XYContinuous, prjManager) { // only horizontal or vertical node allowed

    let deltaX = Math.abs(startingXY[0] - XYContinuous[0]);
    let deltaY = Math.abs(startingXY[1] - XYContinuous[1]);
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
