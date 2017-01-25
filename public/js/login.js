$(document).ready(function(){
	$('#welcome').hide();
        $('.ui.form').form({
          fields : {email: {
	              	      identifier: 'email',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter your registered email'},
                                      {type: 'email',
                                       prompt: 'Please enter a valid email address'}]
                           },
                    password: {
                                identifier: 'password',
				rules: [{type: 'empty',
                                         prompt: 'Please enter your password'},
                                        {type: 'length[6]',
					 prompt: 'Your password must be at least 6 characters'}]
                              }}
        });
});
