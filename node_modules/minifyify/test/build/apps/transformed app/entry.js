var tmpl = require('./template.hbs')
  , rendered = document.createElement('p');

rendered.innerHTML = tmpl({message: 'HBS Template Worked'});

document.body.appendChild(rendered)
