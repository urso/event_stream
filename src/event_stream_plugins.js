
(function(){ 

    var inP = [{ tagName: 'INPUT',
                 pred: function(x){ return x.type === "text" ||
                                             x.type === "password" ||
                                             x.type === "file"; },
                 event: 'keyup',
                 trans: $field('value')},
               { tagName:'INPUT',
                 pred: function(x){ return x.type === 'button'; },
                 event: 'click'},
               { tagName: 'INPUT',
                 pred: function(x){ return x.type === 'radio'; },
                 event: 'click',
                 trans: $field('value') },
               { tagName:'TEXTAREA',
                 event: 'keyup',
                 trans: $field('value')},
               { tagName:'SELECT',
                     event: 'change',
                     trans: $field('value')},
               { tagName:'SELECT',
                 pred: function(x){ return x.multiple !== null },
                 event: 'change',
                 trans: function(x){ 
                         return $A(x.options)
                                 .filter(function(o){ return o.selected; })
                                 .map($field('value'));
                   }
               },
             ];
    
    var outP = [];
    var setTextOutPs = ['SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'OPTION', 'PRE', 'CODE'];
    var setHtmlOutPs = ['DIV'];

    for(var i=0; i < inP.length; i++) {
        addEventStreamInputPlugin(inP[i]);
    }

    for(var i=0; i < outP.length; i++) {
        addEventStreamOutputPlugin(outP[i]);
    }

    for(var i=0; i < setTextOutPs.length; i++) {
        addEventStreamOutputPlugin(
            {tagName: setTextOutPs[i],
             callback: function(elem, x){ elem.set('text', x); }
            }
        );
    }

    for(var i=0; i < setHtmlOutPs.length; i++) {
        addEventStreamOutputPlugin(
            {tagName: setHtmlOutPs[i],
             callback: function(elem, x){ elem.set('html', x); }
            }
        );
    }
}());

