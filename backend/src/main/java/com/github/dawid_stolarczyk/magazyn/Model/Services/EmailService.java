package com.github.dawid_stolarczyk.magazyn.Model.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public void sendSimpleEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");

            helper.setFrom("Powiadomienia GdzieToLeży.pl <%s>".formatted(mailFrom));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Błąd wysyłki maila", e);
        }
    }
    public void sendTwoFactorCode(String to, String code) {
        Context context = new Context();
        context.setVariable("code", code);
        String htmlContent = templateEngine.process("mail/2fa-code", context);
        String subject = "Your Two-Factor Authentication Code";
        sendSimpleEmail(to, subject, htmlContent);
    }
}
