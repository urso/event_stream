
var add = function(a, b) {
    return parseFloat(a) + parseFloat(b);
}.stream();

var testPwd = function(a, b) {
    return a === b && a.length > 0 ? "yes" : "no"
}.stream();

function init(){
    var esTests = $('eventStreamTest');
    
    $('result').stream(add($('a'), $('b')));

    $('show_pwd').stream(testPwd($('pwd1'), $('pwd2')));

    // show "Hello World" in alert box on button click
    $ES(function(){ alert('Hello World'); })(false, $('click_test'));

    // show textbox and inject textbox into document
    $('html_result').stream($('html_test'));

    // show results of a combo box
    $('show_select1').stream($('select1'));
    
    // show result of a list box with multiple selection
    $('show_select2').stream($('select2'));

    // and using radio buttons:
    var showColor = $ESoneOf( $('showColor').stream() );
    showColor.apply(showColor, $('colors').getChildren());

    // show value of textfield with transfer delay due to
    var showESStart = $('ostart').getElement('span').stream();
    showESStart(false, $ESinject('test', false, $('ostart').getElement('input')));

    //number addition test
    var numTest = $('numTest');
    var counter = $ESpos($('countbtn'));
    $('numConst').stream($ESconst(100, counter)); //whenever button is clicked,
                                                  // event value 100 is send
    $('numCount').stream(counter);
    $('numSum').stream($ESsum(counter));
    $('numFib').stream($ESfib(counter));
}

window.addEvent('domready', function() {
    init();
});

