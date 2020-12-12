import { TxtNode } from "@textlint/ast-node-types"

/**
 * RuleHelper is helper class for textlint.
 * @class RuleHelper
 */
export default class RuleHelper {
    // @ts-ignore
    private _ruleContext: any;

    /**
     * Initialize RuleHelper with RuleContext object.
     * @param {RuleContext} ruleContext the ruleContext is context object of the rule.
     */
    constructor(ruleContext: any) {
        this._ruleContext = ruleContext;
    }

    /**
     * Get parents of node.
     * The parent nodes are returned in order from the closest parent to the outer ones.
     * {@link node} is not contained in the results.
     * @param {TxtNode} node the node is start point.
     */
    getParents(node: TxtNode) {
        const result = [];
        let parent = node.parent;
        while (parent != null) {
            result.push(parent);
            parent = parent.parent;
        }
        return result;
    }

    /**
     * Return true if `node` is wrapped any one of node {@link types}.
     * @param {TxtNode} node is target node
     * @param {string[]} types are wrapped target node
     * @returns {boolean}
     */
    isChildNode(node: TxtNode, types: string[]) {
        const parents = this.getParents(node);
        const parentsTypes = parents.map(function (parent) {
            return parent.type;
        });
        return types.some(function (type) {
            return parentsTypes.some(function (parentType) {
                return parentType === type;
            });
        });
    }
}
