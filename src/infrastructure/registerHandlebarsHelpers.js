const getTemplate = foundry.applications?.handlebars?.getTemplate ?? globalThis.getTemplate;

export async function registerHandlebarsHelpers() {
    Handlebars.registerHelper('endsWith', function(str, suffix) {
        if (!str || !suffix) {
            return false;
        }
        return str.endsWith(suffix);
    });

    const treeNodeTemplate = await getTemplate('modules/obsidian-bridge/templates/partials/tree-node.hbs');
    Handlebars.registerPartial('tree-node', treeNodeTemplate);
}
