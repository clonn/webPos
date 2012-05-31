/**
 * @overview
 * Using jQuery with ejs html template engine.
 *
 * @author Caesar Chi (clonn)
 * @version 2012/05/26
 */
(function ($) {
    var host = window.location.hostname,
        displayNode,
        chatTpl,
        socket;

    $(document).ready(function () {
        var displayNode = $("#display-message"),
            chatTpl = $("#js-template"),
            userTpl = $("#js-user-template"),
            socket = io.connect(host);


        String.prototype.sanitizeHTML=function (white,black) {
           if (!white) white="b|i|p|br";//allowed tags
           if (!black) black="script|object|embed";//complete remove tags
           e=new RegExp("(<("+black+")[^>]*>.*</\\2>|(?!<[/]?("+white+")(\\s[^<]*>|[/]>|>))<[^<>]*>|(?!<[^<>\\s]+)\\s[^</>]+(?=[/>]))", "gi");
           return this.replace(e,"");
        }

        function getCookie(name)
        {
            var arg = name + "=";
            var alen = arg.length;
            var clen = document.cookie.length;
            var i = 0;
            while (i < clen) {
                var j = i + alen;
                if (document.cookie.substring(i, j) == arg)
                    return getCookieVal(j);
                i = document.cookie.indexOf(" ", i) + 1;
                if (i == 0) break;
            }
            return null;
        }

        function getCookieVal(offset)
        {
            var endstr = document.cookie.indexOf(";", offset);
        if (endstr == -1)
            endstr = document.cookie.length;
            return unescape(document.cookie.substring(offset, endstr));
        }

        function showMsg(data) {
            var newMsgNode= $(chatTpl.html());

            newMsgNode.find(".snapshot").html([
                "<a href='http://www.facebook.com/",
                data.userid,
                "' target='_blank'><img src='http://graph.facebook.com/",
                data.userid,
                "/picture'></a>",
            ].join(""));

            newMsgNode.find(".message").html(data.msg.sanitizeHTML());
            newMsgNode.find(".time").html(", Time: " + new Date().toUTCString());

            displayNode.append(newMsgNode).scrollTop(99999999999999);
        }

        socket.on("recieveMsg", function (data) {
            if (data.status !== "ok") {
                alert("Recieve message error");
                return;
            }
            showMsg(data);
        });

        socket.on("login", function (data) {
            var loginNode,
                template;

            if (data.status == "ok") {
                loginNode = $("#login-user");
                window.login = loginNode;
                console.log(data.userid);

                if (loginNode.find("#user-" + data.userid).length < 1) {
                    template = userTpl.html();
                    template = template.replace(/{{user-id}}/g, data.userid);
                    loginNode.append(template);
                }
            }
        });

        $("#chat").submit(function (e) {
            e.preventDefault();

            var self = $(this),
                msgNode = self.find("#message"),
                newMsgNode= $(chatTpl.html()),
                selfValue = msgNode.val();

            var data = {
                    userid: getCookie('userid'),
                    msg: selfValue
                };


            showMsg(data);
            msgNode.val("");
            socket.emit("sendMsg", {msg: selfValue});
        });

        displayNode.scrollTop(99999999999999);

    });
})(jQuery);



