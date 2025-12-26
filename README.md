
# การตั้งค่า Google Sheets สำหรับระบบ Leaderboard (SUM Version)

เพื่อให้แอปแสดงคะแนนรวมและอันดับมาแรงได้ถูกต้อง กรุณาสร้างชีตใหม่ 2 ชีต (LeaderboardView และ TrendingView) และวางสูตรที่เซลล์ **A1** ดังนี้:

### 1. ชีตชื่อ `LeaderboardView` (อันดับสะสมตลอดกาล)
สูตรนี้จะรวม XP ของทุกคนเข้าด้วยกัน และดึงข้อมูลล่าสุด (ชื่อ, รูป, Org) มาแสดง:
```excel
=QUERY(profile!A:M, "SELECT Col2, MAX(Col3), MAX(Col4), SUM(Col10), MAX(Col11), MAX(Col12), MAX(Col13) WHERE Col2 IS NOT NULL GROUP BY Col2 ORDER BY SUM(Col10) DESC LABEL MAX(Col3) 'displayName', MAX(Col4) 'profilePicture', SUM(Col10) 'totalXp', MAX(Col11) 'level', MAX(Col12) 'badges', MAX(Col13) 'organization'", 1)
```

### 2. ชีตชื่อ `TrendingView` (อันดับมาแรง 7 วันล่าสุด)
สูตรนี้จะรวม XP (SUM) เฉพาะรายการที่เกิดขึ้นภายใน 7 วันที่ผ่านมาเท่านั้น:
```excel
=QUERY(profile!A:M, "SELECT Col2, MAX(Col3), MAX(Col4), SUM(Col10), MAX(Col13) WHERE Col2 IS NOT NULL AND Col1 > date '"&TEXT(TODAY()-7, "yyyy-mm-dd")&"' GROUP BY Col2 ORDER BY SUM(Col10) DESC LABEL MAX(Col3) 'displayName', MAX(Col4) 'profilePicture', SUM(Col10) 'weeklyXp', MAX(Col13) 'organization'", 1)
```

---

### รายละเอียดคอลัมน์ (Reference)
- **Col1 (A):** Timestamp
- **Col2 (B):** Username
- **Col10 (J):** XP Delta (คะแนนที่ได้รับในครั้งนั้นๆ)
- **Col13 (M):** Organization (หน่วยงาน)
