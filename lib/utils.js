'use strict';

function toCamelCase (string) {
  var parts = string.split('_');
  var capitalized = parts.map(function (part, idx) {
    if (idx > 0) {
      return capitalizeFirstLetter(part);
    }

    return part;
  });

  return capitalized.join('');
}

function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  toCamelCase: toCamelCase,
  capitalizeFirstLetter: capitalizeFirstLetter
};
