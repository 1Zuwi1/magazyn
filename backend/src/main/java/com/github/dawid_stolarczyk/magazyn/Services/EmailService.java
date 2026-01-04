package com.github.dawid_stolarczyk.magazyn.Services;

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

    @Value("${app.name}")
    private String appName;

    public void sendSimpleEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    "UTF-8");

            helper.setFrom("Powiadomienia %s <%s>".formatted(appName, mailFrom));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error sending email", e);
        }
    }

    public void sendTwoFactorCode(String to, String code) {
        Context context = new Context();
        context.setVariable("code", code);
        String htmlContent = templateEngine.process("mail/2fa-code", context);
        String subject = "Twój kod uwierzytelniania dwuskładnikowego";
        sendSimpleEmail(to, subject, htmlContent);
    }
}
