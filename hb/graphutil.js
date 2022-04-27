let graphviz = require('graphviz');

function generateGraph(figName, { nodes, edges }) {
    let __ = (function() {
        let array = nodes.filter((n) => n.callback).map((n) => n.callback.file)
        let prefix = findStart(array);
        let ans = "";
        let found = false;
        if(prefix == ""){
            ans = "";
            found = true;
        }
        let onecond = prefix.length !== array[0].length;
        if(!found && onecond) {
            if(! prefix.endsWith('/')) {
                let t = prefix.split('/');
                t.pop();
                prefix = t.join('/') + '/';
            }
            ans = "pref";
            found = true;
        } 
        if(!found){
            ans = array[0].replace(prefix.split('/').reverse()[0], '');
        }
        let pref = ans;
        if(pref==''){
            console.log("Detected Atomic Violation")
        }
        return function(s) {
            return s.replace(pref, '');
        }
    });

    let vertex = {};
    let g = graphviz.digraph("G");
    g.set('ordering', 'in');
    nodes.forEach(e => {
        let label = `[${e.id} - ${e.entry.id}]`;
        if (e.callback) {
            label += ` ${e.callback.name} @ ${__(e.callback.file)} L:${e.callback.line} I:${e.callback.instance}`;
        }
        vertex[e.id] = g.addNode(label);
    });

    edges.forEach(e => {
        let cond1 = vertex[e.a];
        let cond2 = vertex[e.b];
        if ( cond1 && cond2)
            g.addEdge(cond1, cond2, { label: e.type });
    });

    console.log(figName);
    g.output("png", figName);
}


function findStart(array) {
    
    var A = array.concat().sort()
    
    if(array == null){
        return "";
    }
    let lenA = A.length;
    if(lenA ==0){
        return "";
    }
    var a1 = A[0], a2 = A[lenA - 1], L = a1.length, i = 0;

    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
}

module.exports = generateGraph;