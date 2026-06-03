import java.io.File;

public class Fix {
    public static void main(String[] args) {
        System.out.println("--- PLUGINS REPAIR START ---");
        try {
            File plugins = new File("plugins");
            if (plugins.exists()) {
                System.out.println("Found plugins: " + plugins.getAbsolutePath() + " (isFile: " + plugins.isFile() + ")");
                boolean deleted = plugins.delete();
                System.out.println("Deleted plugins file: " + deleted);
            } else {
                System.out.println("plugins path does not exist, creating directly");
            }
            boolean created = plugins.mkdirs();
            System.out.println("Created plugins directory: " + created);
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("--- PLUGINS REPAIR END ---");
    }
}
