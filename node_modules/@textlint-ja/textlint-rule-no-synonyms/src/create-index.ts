import { fetchDictionary, SudachiSynonyms } from "sudachi-synonyms-dictionary";

export type Midashi = string;

/**
 * Dictionary Design
 *
 * // Index
 * <Midashi>: ItemGroup[]
 * // Check
 * SudachiSynonyms: boolean
 * ItemGroup: boolean
 * // Collection
 * usedItemGroup.forEach
 */
export class ItemGroup {
    constructor(public items: SudachiSynonyms[]) {

    }

    usedItems(usedItemSet: Set<SudachiSynonyms>, { allowAlphabet, allows }: { allowAlphabet: boolean, allows: string[] }): SudachiSynonyms[] {
        // sort by used
        return Array.from(usedItemSet.values()).filter(item => {
            if (allowAlphabet && item.hyoukiYure === "アルファベット表記") {
                return false;
            }
            if (allows.includes(item.midashi)) {
                return false;
            }
            return this.items.includes(item);
        });
    }
}

export type IndexType = { keyItemGroupMap: Map<Midashi, ItemGroup[]>; SudachiSynonymsItemGroup: Map<SudachiSynonyms, ItemGroup>; };
let _ret: IndexType | null = null;
export const createIndex = async (): Promise<IndexType> => {
    if (_ret) {
        return Promise.resolve(_ret);
    }
    const keyItemGroupMap: Map<Midashi, ItemGroup[]> = new Map();
    const SudachiSynonymsItemGroup: Map<SudachiSynonyms, ItemGroup> = new Map();
    const SynonymsDictionary = await fetchDictionary();
    SynonymsDictionary.forEach(group => {
        const groupByVocabularyNumber = group.items.reduce((res, item) => {
            res[item.vocabularyNumber!] = (res[item.vocabularyNumber!] || []).concat(item);
            return res;
        }, {} as { [index: string]: SudachiSynonyms[] });
        const itemGroups = Object.values(groupByVocabularyNumber).filter(items => {
            return items.length > 1;
        }).map(items => {
            return new ItemGroup(items);
        });
        // register key with itemGroup
        itemGroups.forEach(itemGroup => {
            itemGroup.items.forEach(item => {
                const oldItemGroup = keyItemGroupMap.get(item.midashi) || [];
                keyItemGroupMap.set(item.midashi, oldItemGroup.concat(itemGroup));
                SudachiSynonymsItemGroup.set(item, itemGroup);
            });
        });
    });
    _ret = {
        keyItemGroupMap,
        SudachiSynonymsItemGroup
    };
    return Promise.resolve(_ret);
};
