$(function() {
    $('#code-image').on('click', function() {
        var src = 'verifier-code?' + new Date().valueOf();
        $(this).attr('src', src);
    })

    $('.button').on('click', function() {
        var value = $('#input-code').val();
        if (value.trim() === '') {
            alert('验证码不能为空');
            return
        }
        var data = {
            code: value
        };
        $.ajax({
            type: 'post',
            url: 'check-code',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success: function(data) {
                var reiderct = data.redirect;
                document.location.href = reiderct;
            },
            error: function(error) {
                var message = error.responseJSON.message || undefined;
                alert(message);
                $('#code-image').click();
                $('#input-code').val('');
            }
        })
    });

    $('#input-code').on('keypress', function(event) {
        console.log('111');
        if (event.keyCode == '13') {
            $('.button').click();
        }
    })

})