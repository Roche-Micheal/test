const emailSetup = function (setup, template) {
    for (const [key, value] of Object.entries(setup)) {
        template = template.replace(`{${key}}`, value);

    }
    return template
}

module.exports = emailSetup;