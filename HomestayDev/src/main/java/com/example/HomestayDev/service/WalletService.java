package com.example.HomestayDev.service;

import com.example.HomestayDev.config.VNPayConfig;
import com.example.HomestayDev.dto.TransactionDto;
import com.example.HomestayDev.model.Transaction;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.Wallet;
import com.example.HomestayDev.model.enums.TransactionType;
import com.example.HomestayDev.repository.TransactionRepository;
import com.example.HomestayDev.repository.UserRepository;
import com.example.HomestayDev.repository.WalletRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final VNPayConfig vnPayConfig;

    @Transactional
    public Wallet getWalletByUserId(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
    }

    private Wallet createWallet(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .build();
        return walletRepository.save(wallet);
    }

    public String createDepositUrl(BigDecimal amount, UUID userId, HttpServletRequest request) {
        Wallet wallet = getWalletByUserId(userId);
        long vnpAmount = amount.longValue() * 100;
        String vnp_TxnRef = VNPayConfig.getRandomNumber(8) + "-W-" + wallet.getId();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VNPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VNPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(vnpAmount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Nap tien vao vi: " + wallet.getId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl().replace("payment/vnpay-return", "wallets/vnpay-return"));
        vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
    }

    @Transactional
    public boolean processDepositReturn(Map<String, String> params) {
        Map<String, String> fields = new HashMap<>(params);
        String secureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String checkSum = VNPayConfig.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        if (checkSum.equals(secureHash) && "00".equals(fields.get("vnp_ResponseCode"))) {
            String txnRef = fields.get("vnp_TxnRef");
            
            if (transactionRepository.existsByVnpayTxnRef(txnRef)) {
                return true; // Already processed
            }

            String[] parts = txnRef.split("-W-", 2);
            if (parts.length > 1) {
                Long walletId = Long.parseLong(parts[1]);
                Wallet wallet = walletRepository.findById(walletId)
                        .orElseThrow(() -> new RuntimeException("Wallet not found"));

                BigDecimal amount = new BigDecimal(fields.get("vnp_Amount")).divide(new BigDecimal(100));

                wallet.setBalance(wallet.getBalance().add(amount));
                walletRepository.save(wallet);

                Transaction transaction = Transaction.builder()
                        .wallet(wallet)
                        .amount(amount)
                        .type(TransactionType.DEPOSIT)
                        .description("N\u1ea1p ti\u1ec1n v\u00e0o v\u00ed qua VNPay")
                        .balanceAfter(wallet.getBalance())
                        .vnpayTxnRef(txnRef)
                        .build();
                transactionRepository.save(transaction);
                return true;
            }
        }
        return false;
    }

    /**
     * Giữ tiền của User khi đặt phòng bằng Ví.
     * Tiền bị trừ khỏi Ví User ngay lập tức, nhưng chưa cộng cho Host.
     * Host sẽ nhận tiền khi phê duyệt đơn (gọi releaseToHost).
     */
    @Transactional
    public void holdPayment(UUID userId, BigDecimal amount, String description) {
        Wallet userWallet = getWalletByUserId(userId);
        if (userWallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("S\u1ed1 d\u01b0 v\u00ed kh\u00f4ng \u0111\u1ee7 \u0111\u1ec3 thanh to\u00e1n. Vui l\u00f2ng n\u1ea1p th\u00eam ti\u1ec1n.");
        }
        userWallet.setBalance(userWallet.getBalance().subtract(amount));
        walletRepository.save(userWallet);

        Transaction outTx = Transaction.builder()
                .wallet(userWallet)
                .amount(amount.negate())
                .type(TransactionType.PAYMENT)
                .description(description)
                .balanceAfter(userWallet.getBalance())
                .build();
        transactionRepository.save(outTx);
    }

    /**
     * Hoàn tiền vào Ví của User khi đơn bị hủy hoặc từ chối.
     * Dùng cho cả thanh toán Ví lẫn VNPAY (hoàn vào Ví hệ thống).
     */
    @Transactional
    public void refundToWallet(UUID userId, BigDecimal amount, String description) {
        Wallet userWallet = getWalletByUserId(userId);
        userWallet.setBalance(userWallet.getBalance().add(amount));
        walletRepository.save(userWallet);

        Transaction refundTx = Transaction.builder()
                .wallet(userWallet)
                .amount(amount)
                .type(TransactionType.REFUND)
                .description(description)
                .balanceAfter(userWallet.getBalance())
                .build();
        transactionRepository.save(refundTx);
    }

    /**
     * Cộng tiền vào Ví của Host sau khi Host phê duyệt đơn đặt phòng.
     */
    @Transactional
    public void releaseToHost(UUID hostUserId, BigDecimal amount, String description) {
        Wallet hostWallet = getWalletByUserId(hostUserId);
        hostWallet.setBalance(hostWallet.getBalance().add(amount));
        walletRepository.save(hostWallet);

        Transaction inTx = Transaction.builder()
                .wallet(hostWallet)
                .amount(amount)
                .type(TransactionType.RECEIPT)
                .description(description)
                .balanceAfter(hostWallet.getBalance())
                .build();
        transactionRepository.save(inTx);
    }

    /**
     * Trừ tiền từ Ví của Host khi đơn hàng đã xác nhận bị hủy.
     */
    @Transactional
    public void deductFromHost(UUID hostUserId, BigDecimal amount, String description) {
        Wallet hostWallet = getWalletByUserId(hostUserId);
        hostWallet.setBalance(hostWallet.getBalance().subtract(amount));
        walletRepository.save(hostWallet);

        Transaction outTx = Transaction.builder()
                .wallet(hostWallet)
                .amount(amount.negate())
                .type(TransactionType.PAYMENT)
                .description(description)
                .balanceAfter(hostWallet.getBalance())
                .build();
        transactionRepository.save(outTx);
    }

    /** @deprecated Dùng holdPayment + releaseToHost thay thế */
    @Transactional
    public void transferMoney(UUID fromUserId, UUID toUserId, BigDecimal amount, String description) {
        holdPayment(fromUserId, amount, description);
        releaseToHost(toUserId, amount, description);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDto> getMyTransactions(UUID userId) {
        Wallet wallet = getWalletByUserId(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    private TransactionDto mapToDto(Transaction tx) {
        return TransactionDto.builder()
                .id(tx.getId())
                .amount(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO)
                .type(tx.getType() != null ? tx.getType().name() : "DEPOSIT")
                .description(tx.getDescription())
                .balanceAfter(tx.getBalanceAfter())
                .vnpayTxnRef(tx.getVnpayTxnRef())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
