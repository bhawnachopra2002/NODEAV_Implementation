const _ = require('lodash');
const Graph = require('@dagrejs/graphlib').Graph;
const dijkstraAll = require('@dagrejs/graphlib').alg.dijkstraAll;

class Relations {
    constructor(pHb) {
        let arglen = arguments.length;
        if ( arglen === 0)
            this.hb = [];
        else
            this.hb = pHb;
    }

    add(a, b, type) {
        this.hb.push({ a, b, type });
    }
    checkTypeId(h,id){
        let res = h.b === id && h.type === 'registration';
        return res;
    }
    registeredInSameTick(aid, bid) {
        let pa = this.hb.find((h) => this.checkTypeId(h,aid) );
        let pb = this.hb.find((h) => this.checkTypeId(h,bid));
        if (!pa || !pb)
            return false;

        return pa.a === pb.a;
    }

    registeredIn(aid) {
        if (this.hb.find((h) => this.checkTypeId(h,aid)))
            return this.hb.find((h) => this.checkTypeId(h,aid)).a;
        return null;
    }
    checkEquality(a,b){
        return a===b;
    }

    happensBefore(aoi, aoj) {
        let visited = {};
        let rels = this.hb.filter(r => this.checkEquality(r.a, aoi));
        while (rels.length > 0) {
            let relation = rels.pop();
            if (!visited[relation.b]) {
                visited[relation.b] = true;
                let cond1 = relation.b === aoj;
                if (cond1)
                    return true;
                else {
                    let ind_rels = this.hb.filter(r => this.checkEquality(r.a, relation.b));
                    rels.push(...ind_rels);
                }
            }
        }
        return false;
    }

    startGraphDS(nodes) {
        let graph = new Graph();
        nodes.forEach(n => graph.setNode(n.id));
        this.hb.forEach(r => graph.setEdge(r.a, r.b));
        this.graph = dijkstraAll(graph);
    }

    hBGraphLib(aoi, aoj) {
        let isgreater = this.graph[aoi][aoj].distance > 0
        let isnotinfinity = this.graph[aoi][aoj].distance !== Number.POSITIVE_INFINITY;
        return isgreater && isnotinfinity;
    }

    removeIncomingTo(id) {
        _.remove(this.hb, (r) => this.checkEquality(r.b === id) && this.checkEquality(r.type, 'promise-resolve'));
    }
}

module.exports = Relations