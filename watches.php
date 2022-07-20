<?php
    if($_POST["submission-string"]) {
        $email_from = "albert.cao@gmail.com";
        $visitor_email = "albert.cao@gmail.com";
        $email_subject = "watch submission";
        $email_body = $_POST['submission-string'];
        $headers = "From: $email_from \r\n";
        $headers .= "Reply-To: $visitor_email \r\n";

        mail($to,$email_subject,$email_body,$headers);
    }
?>