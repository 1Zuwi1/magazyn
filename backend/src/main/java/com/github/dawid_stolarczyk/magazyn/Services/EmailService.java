package com.github.dawid_stolarczyk.magazyn.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String mailFrom;

    @Value("${app.name}")
    private String appName;

    @Async
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
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Error sending email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    public void sendTwoFactorCode(String to, String code) {
        Context context = new Context();
        context.setVariable("code", code);
        String htmlContent = templateEngine.process("mail/2fa-code", context);
        String subject = "Twój kod uwierzytelniania dwuskładnikowego";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendVerificationEmail(String to, String verificationLink) {
        Context context = new Context();
        context.setVariable("verificationLink", verificationLink);
        String htmlContent = templateEngine.process("mail/verification-email", context);
        String subject = "Weryfikacja adresu e-mail";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetLink) {
        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        String htmlContent = templateEngine.process("mail/password-reset", context);
        String subject = "Resetowanie hasła";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendBatchNotificationEmail(String to, List<String> alertMessages, String notificationsLink) {
        Context context = new Context();
        context.setVariable("alertMessages", alertMessages);
        context.setVariable("alertCount", alertMessages.size());
        context.setVariable("notificationsLink", notificationsLink);
        String htmlContent = templateEngine.process("mail/batch-notification", context);
        String subject = alertMessages.size() == 1 ? "Nowe powiadomienie" : "Nowe powiadomienia (" + alertMessages.size() + ")";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendBackupCodesGeneratedInfoEmail(String to, String settingsLink) {
        Context context = new Context();
        context.setVariable("settingsLink", settingsLink);
        String htmlContent = templateEngine.process("mail/backupcodes-generated-information", context);
        String subject = "Nowe kody zapasowe wygenerowane";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendBackupNotificationEmail(String to, String warehouseName, boolean success, Long totalRecords,
                                            Long sizeBytes, String completedAt, String backupType, String triggeredByName,
                                            String errorMessage, String backupLink) {
        Context context = new Context();
        context.setVariable("warehouseName", warehouseName);
        context.setVariable("success", success);
        context.setVariable("totalRecords", totalRecords);
        context.setVariable("sizeBytes", sizeBytes + " B");
        context.setVariable("completedAt", completedAt);
        context.setVariable("backupType", backupType);
        context.setVariable("triggeredByName", triggeredByName);
        context.setVariable("errorMessage", errorMessage);
        context.setVariable("backupLink", backupLink);
        String htmlContent = templateEngine.process("mail/backup-notification", context);
        String subject = success ? "Backup zakończony pomyślnie" : "Backup nie powiódł się";
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendApiKeyCreatedEmail(String to, String keyName, String warehouseName, String createdAt) {
        Context context = new Context();
        context.setVariable("keyName", keyName);
        context.setVariable("warehouseName", warehouseName);
        context.setVariable("createdAt", createdAt);
        String htmlContent = templateEngine.process("mail/api-key-created", context);
        String subject = "Nowy klucz API utworzony: " + keyName;
        sendSimpleEmail(to, subject, htmlContent);
    }

    @Async
    public void sendReportEmail(String to, String reportTitle, byte[] fileBytes, String filename, String contentType) {
        try {
            Context context = new Context();
            context.setVariable("reportTitle", reportTitle);
            context.setVariable("filename", filename);
            String htmlContent = templateEngine.process("mail/report-generated", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");

            helper.setFrom("Powiadomienia %s <%s>".formatted(appName, mailFrom));
            helper.setTo(to);
            helper.setSubject("Raport: " + reportTitle);
            helper.setText(htmlContent, true);
            helper.addAttachment(filename, new ByteArrayDataSource(fileBytes, contentType));

            mailSender.send(message);
            log.info("Report email sent successfully to {} with attachment {}", to, filename);
        } catch (MessagingException e) {
            log.error("Error sending report email to {}: {}", to, e.getMessage(), e);
        }
    }
}
