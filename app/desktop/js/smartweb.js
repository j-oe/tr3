$('.sw-call-to-action').on('click', function(){
	moveStage();
});

$('.tr3-back').on('click', function(){
	tr3.back();
});

moveStage = function () {
	$('.sw-call-to-action').animate({'left': '-1000px'}, 500, function (){
		$('.sw-text').fadeOut(500);
		$('.sw-jumbotron').animate({'left': '2000px'}, 700, function () {
			tr3.init('logic/smarthelp.xml', {config: ['elektro', 'customer']});
			$('.tr3').fadeIn(700);
			$('.sw-stage').remove();
			$('.sw-header h1').css('cursor', 'pointer').on('click', function(){
				tr3.init('logic/smarthelp.xml');
			});
		});
	});
}