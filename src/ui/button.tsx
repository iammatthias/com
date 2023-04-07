import styles from "./button.module.scss";

type ButtonProps = {
  children: React.ReactNode;
};

export default function Button({ children }: ButtonProps) {
  return (
    <>
      <button className={`${styles.button}`}>{children}</button>
    </>
  );
}
