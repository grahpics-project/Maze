(function ($) {
 
    $.fn.load = function() {
        let settings = {
            pos:'fixed',// Default Position
            top:'0px',  // Default Top value
            left:'0px', // Default Left value
            width:'100%', // Default width 
            height:'100%', // Default Height
            zIndex: '999',  // Default zIndex 
            bgColor: '#CCAD70', // Default background color
            spinner:'spinner5', // Default Spinner
        };

        //Spinners
        const spinner01 = '<div class="fl spinner1"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>';
        const spinner02 = '<div class="fl spinner2"><div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div></div>';
        const spinner03 = '<div class="fl spinner3"><div class="dot1"></div><div class="dot2"></div></div>';
        const spinner04 = '<div class="fl spinner4"></div>';
        const spinner05 = '<div class="fl spinner5"><div class="cube1"></div><div class="cube2"></div></div>';
        const spinner06 = '<div class="fl spinner6"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>';
        const spinner07 = '<div class="fl spinner7"><div class="circ1"></div><div class="circ2"></div><div class="circ3"></div><div class="circ4"></div></div>';

        //The target
        const el = $(this);

        //Init styles
        const initStyles = {
            'position':settings.pos,
            'width':settings.width,
            'height':settings.height,
            'top':settings.top,
            'left':settings.left
        };

        //Apply styles
        el.css(initStyles);

        //Each 
        el.each(function() {
            let a = settings.spinner;
            //console.log(a)
                switch (a) {
                    case 'spinner1':
                            el.html(spinner01);
                        break;
                    case 'spinner2':
                            el.html(spinner02);
                        break;
                    case 'spinner3':
                            el.html(spinner03);
                        break;
                    case 'spinner4':
                            el.html(spinner04);
                        break;
                    case 'spinner5':
                            el.html(spinner05);
                        break;
                    case 'spinner6':
                            el.html(spinner06);
                        break;
                    case 'spinner7':
                            el.html(spinner07);
                        break;
                    default:
                        el.html(spinner01);
                    }

                centerLoader();
        });

        //Return Styles 
        return this.css({
            'backgroundColor':settings.bgColor,
            'zIndex':settings.zIndex
        });

 
    }; // End Loader

    $.fn.finished = function(target) {
        $(this).fadeOut();
        $(target).fadeIn();
    };
 

        //Center Spinner
        function centerLoader() {

            let winW = $(window).width();
            let winH = $(window).height();
            let load = $('.fl');

            let spinnerW = load.outerWidth();
            let spinnerH = load.outerHeight();

            load.css({
                'position':'absolute',
                'left':(winW/2)-(spinnerW/2),
                'top':(winH/2)-(spinnerH/2)
            });

        }

        $(window).load(function(){
                centerLoader();
              $(window).resize(function(){
                centerLoader();
              });
        });


}(jQuery));




